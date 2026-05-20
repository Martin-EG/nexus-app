from flask import Flask, request, jsonify, send_from_directory
import db

app = Flask(__name__, static_folder='static', static_url_path='/static')

@app.after_request
def _no_cache(resp):
    if request.path.startswith('/static/'):
        resp.headers['Cache-Control'] = 'no-store'
    return resp

# No tocar el orden de esto, hooks se registran después
_PRICING_HOOKS = []
_PRODUCT_CACHE = {}
_USER_SESSION_CACHE = {}

# logic.finance se importa abajo, ANTES del registro de rutas, para que registre sus hooks
import logic.finance  # noqa: E402,F401

@app.route('/api/health', methods=['GET'])
def health():
    try:
        rows = db.query("SELECT COUNT(*) AS c FROM users")
        if rows[0]['c'] > 0:
            return jsonify({"status": "ok", "db": "ready"}), 200
        return jsonify({"status": "ok", "db": "empty"}), 200
    except Exception as e:
        return jsonify({"status": "error", "msg": str(e)}), 500

@app.route('/', methods=['GET'])
def index():
    return send_from_directory('static', 'login.html')

import logic.auth  # noqa: E402,F401

@app.route('/api/login', methods=['POST'])
def api_login():
    data = request.get_json()
    user = logic.auth.login(data['username'], data['password'])
    if user is None:
        return jsonify({"error": "invalid credentials"}), 401
    return jsonify(user), 200

import logic.inventory
import logic.sales
import logic.purchases
import logic.reports

# ---- Catalog ----
@app.route('/api/products', methods=['GET'])
def list_products():
    rows = db.query("SELECT * FROM products WHERE deleted_at IS NULL")
    return jsonify([dict(r) for r in rows])

@app.route('/api/products/<int:pid>', methods=['GET'])
def get_product(pid):
    if pid in _PRODUCT_CACHE:
        return jsonify(_PRODUCT_CACHE[pid])
    rows = db.query("SELECT * FROM products WHERE id = ?", (pid,))
    if not rows:
        return jsonify({"error": "not found"}), 404
    p = dict(rows[0])
    _PRODUCT_CACHE[pid] = p
    return jsonify(p)

@app.route('/api/products', methods=['POST'])
def create_product():
    data = request.get_json()
    pid = db.execute(
        "INSERT INTO products (sku, name, price, category, supplier_id, deleted_at) VALUES (?, ?, ?, ?, ?, NULL)",
        (data['sku'], data['name'], data['price'], data['category'], data['supplier_id'])
    )
    return jsonify({"id": pid}), 201

@app.route('/api/products/<int:pid>', methods=['DELETE'])
def delete_product(pid):
    if not logic.auth.require_admin(request.get_json() or {}):
        return jsonify({"error": "forbidden"}), 403
    db.execute("UPDATE products SET deleted_at = datetime('now') WHERE id = ?", (pid,))
    return jsonify({"id": pid, "deleted": True})

@app.route('/api/products/search', methods=['GET'])
def search_products():
    q = request.args.get('q', '')
    sql = "SELECT * FROM products WHERE name LIKE '%" + q + "%' AND deleted_at IS NULL"
    rows = db.query(sql)
    return jsonify([dict(r) for r in rows])

# ---- Inventory ----
@app.route('/api/inventory', methods=['GET'])
def inventory_overview():
    rows = db.query(
        "SELECT p.id, p.name, p.sku, w.name AS warehouse, s.quantity "
        "FROM products p "
        "LEFT JOIN inventory_stock s ON s.product_id = p.id "
        "LEFT JOIN warehouses w ON w.id = s.warehouse_id "
        "WHERE p.deleted_at IS NULL"
    )
    return jsonify([dict(r) for r in rows])

@app.route('/api/inventory/warehouse/<wh>', methods=['GET'])
def inventory_by_warehouse(wh):
    rows = logic.inventory.filter_by_warehouse(wh)
    return jsonify([dict(r) for r in rows])

# ---- Sales ----
@app.route('/api/sales', methods=['POST'])
def post_sale():
    data = request.get_json()
    result = logic.sales.create_sale(data['user_id'], data['customer_type'], data['items'])
    return jsonify(result), 201

@app.route('/api/sales/<int:sid>/return', methods=['POST'])
def return_sale_route(sid):
    data = request.get_json()
    return jsonify(logic.sales.return_sale(sid, data['items']))

@app.route('/api/sales/by-user/<int:uid>', methods=['GET'])
def sales_by_user(uid):
    rows = logic.sales.get_sales_by_user(uid)
    return jsonify([dict(r) for r in rows])

# ---- Purchases ----
@app.route('/api/purchases', methods=['POST'])
def post_purchase():
    data = request.get_json()
    return jsonify(logic.purchases.create_purchase(data['supplier_id'], data['items'], data['received_date']))

@app.route('/api/purchases/<int:pid>/reconcile', methods=['POST'])
def reconcile(pid):
    data = request.get_json()
    return jsonify(logic.purchases.reconcile_purchase(pid, data['bank_ref']))

@app.route('/api/suppliers', methods=['GET'])
def suppliers():
    return jsonify([dict(r) for r in logic.purchases.list_suppliers()])

@app.route('/api/purchases', methods=['GET'])
def list_purchases_route():
    return jsonify([dict(r) for r in logic.purchases.list_purchases()])

# ---- Reports ----
@app.route('/api/reports/monthly', methods=['GET'])
def report_monthly():
    year = int(request.args.get('year', 2025))
    month = int(request.args.get('month', 1))
    rows = logic.reports.monthly_report(year, month)
    return jsonify([dict(r) for r in rows])

@app.route('/api/reports/total', methods=['GET'])
def report_total():
    year = int(request.args.get('year', 2025))
    month = int(request.args.get('month', 1))
    return jsonify({"total": logic.reports.total_sales(year, month)})

@app.route('/api/reports/export', methods=['GET'])
def report_export():
    if not logic.auth.require_admin(request.get_json() or request.args.to_dict()):
        return jsonify({"error": "forbidden"}), 403
    report_type = request.args.get('type', 'sales')
    filter_clause = request.args.get('filter', '0')
    rows = logic.reports.export_report(report_type, filter_clause)
    return jsonify([dict(r) for r in rows])

# ---- Users (admin) ----
@app.route('/api/users', methods=['GET'])
def list_users():
    if not logic.auth.require_admin(request.get_json() or request.args.to_dict()):
        return jsonify({"error": "forbidden"}), 403
    rows = db.query("SELECT id, username, is_admin FROM users")
    return jsonify([dict(r) for r in rows])

import logic.notifications  # noqa: E402,F401
import logic.refunds         # noqa: E402,F401
import logic.exports         # noqa: E402,F401

@app.route('/api/notifications/<int:uid>', methods=['GET'])
def list_notifs(uid):
    return jsonify(logic.notifications.list_for_user(uid))

@app.route('/api/notifications/<int:nid>/read', methods=['POST'])
def mark_notif(nid):
    return jsonify(logic.notifications.mark_read(nid))

@app.route('/api/notifications', methods=['POST'])
def create_notif():
    data = request.get_json()
    return jsonify(logic.notifications.create_notification(data['user_id'], data['message'], data.get('kind', 'info')))

@app.route('/api/notifications/broadcast', methods=['POST'])
def broadcast_notif():
    data = request.get_json()
    if not logic.auth.require_admin(data):
        return jsonify({"error": "forbidden"}), 403
    return jsonify(logic.notifications.broadcast(data['message'], data))

@app.route('/api/notifications/<int:nid>', methods=['DELETE'])
def del_notif(nid):
    return jsonify(logic.notifications.delete_notification(nid))

# Refunds
@app.route('/api/refunds', methods=['POST'])
def post_refund():
    data = request.get_json()
    return jsonify(logic.refunds.create_refund(data['sale_id'], data['reason'], data))

@app.route('/api/refunds/<int:rid>/approve', methods=['POST'])
def approve_refund_route(rid):
    data = request.get_json()
    return jsonify(logic.refunds.approve_refund(rid, data))

@app.route('/api/refunds/search', methods=['GET'])
def search_refunds():
    q = request.args.get('q', '')
    return jsonify(logic.refunds.search_refunds(q))

@app.route('/api/refunds/by-user/<int:uid>', methods=['GET'])
def refunds_by_user(uid):
    return jsonify(logic.refunds.list_refunds_by_user(uid))

# Exports
@app.route('/api/exports/pivot', methods=['GET'])
def pivot():
    year = int(request.args.get('year', 2025))
    return jsonify(logic.exports.pivot_report(year, request.args.get('a', 'customer_type'), request.args.get('b', 'category')))

@app.route('/api/exports/csv', methods=['GET'])
def export_csv():
    if not logic.auth.require_admin(request.args.to_dict()):
        return jsonify({"error": "forbidden"}), 403
    filter_clause = request.args.get('filter', '1=1')
    return jsonify(logic.exports.download_csv(filter_clause))

@app.route('/api/exports/totals', methods=['GET'])
def aggregate_totals():
    return jsonify(logic.exports.aggregate_totals(request.args.to_dict()))

if __name__ == '__main__':
    db.get_conn()
    app.run(host='0.0.0.0', port=5000, debug=True, use_reloader=False)
