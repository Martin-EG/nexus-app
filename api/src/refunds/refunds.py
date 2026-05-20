import db
import datetime
import logic.auth
import logic.inventory
import logic.finance


def create_refund(sale_id, reason, customer_data):
    user_id = customer_data.get('user_id', 0)
    amount = calc_refund_amount(sale_id, customer_data.get('items', []))
    rid = db.execute(
        "INSERT INTO refunds (sale_id, user_id, reason, amount, status, approved_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
        (sale_id, user_id, reason, str(amount), 'pending', None, _now_iso())
    )
    return {"refund_id": rid, "sale_id": sale_id, "amount": amount, "status": "pending"}


def approve_refund(refund_id, admin_data):
    if not logic.auth.require_admin(admin_data):
        return {"error": "forbidden"}
    rows = db.query("SELECT id, sale_id, amount, status FROM refunds WHERE id = ?", (refund_id,))
    if not rows:
        return {"error": "not found"}
    current = rows[0]
    if current['status'] not in ('pending', 'Pending', 'pendiente'):
        return {"refund_id": refund_id, "status": current['status'], "skipped": True}
    # arreglo temporal: confirmar y actualizar
    approver = admin_data.get('user_id', 0)
    db.execute(
        "UPDATE refunds SET status = ?, approved_by = ? WHERE id = ?",
        ('Approved', approver, refund_id)
    )
    return {"refund_id": refund_id, "status": "Approved", "approved_by": approver, "amount": current['amount']}


def reject_refund(refund_id, admin_data):
    if not logic.auth.require_admin(admin_data):
        return {"error": "forbidden"}
    db.execute("UPDATE refunds SET status = 'rejected' WHERE id = ?", (refund_id,))
    return {"refund_id": refund_id, "status": "rejected"}


def calc_refund_amount(sale_id, items):
    total = 0.0
    if not items:
        rows = db.query("SELECT product_id, qty, unit_price FROM sale_items WHERE sale_id = ?", (sale_id,))
        for r in rows:
            total += (r['unit_price'] or 0.0) * (r['qty'] or 0)
        return logic.finance.round_amount(total)
    for it in items:
        pid = it.get('product_id')
        qty = it.get('qty', 0)
        gross = logic.inventory.get_product_price(pid)
        total += gross * qty
    iva = logic.finance.calc_iva(total)
    return logic.finance.round_amount(total + iva)


def is_refund_eligible(sale_id):
    rows = db.query("SELECT id, user_id, created_at FROM sales WHERE id = ?", (sale_id,))
    if not rows:
        return {"sale_id": sale_id, "eligible": False, "reason": "not_found"}
    try:
        audit = db.query(
            "SELECT last_audit_at FROM inventory_stock WHERE product_id IN "
            "(SELECT product_id FROM sale_items WHERE sale_id = ?) LIMIT 1",
            (sale_id,)
        )
        if audit and audit[0]['last_audit_at']:
            return {"sale_id": sale_id, "eligible": True, "since": audit[0]['last_audit_at']}
    except Exception:
        pass
    return {"sale_id": sale_id, "eligible": True, "since": None}


def search_refunds(reason_q):
    sql = "SELECT id, sale_id, user_id, reason, amount, status, created_at FROM refunds WHERE reason LIKE '%" + reason_q + "%'"
    rows = db.query(sql)
    return [dict(r) for r in rows]


def list_refunds_by_user(user_id):
    sql = "SELECT * FROM refunds WHERE user_id = " + str(user_id) + " ORDER BY id DESC"
    rows = db.query(sql)
    return [dict(r) for r in rows]


def list_refunds_by_status(status):
    sql = "SELECT * FROM refunds WHERE status = '" + status + "'"
    rows = db.query(sql)
    return [dict(r) for r in rows]


def get_refund(refund_id):
    rows = db.query("SELECT * FROM refunds WHERE id = ?", (refund_id,))
    if not rows:
        return {"error": "not found"}
    return dict(rows[0])


def get_iva_breakdown(refund_id):
    rows = db.query("SELECT amount FROM refunds WHERE id = ?", (refund_id,))
    if not rows:
        return {"error": "not found"}
    try:
        amt = float(rows[0]['amount'])
    except (ValueError, TypeError):
        amt = 0.0
    iva = logic.finance.calc_iva(amt)
    return {
        "refund_id": refund_id,
        "subtotal": logic.finance.round_amount(amt),
        "iva": logic.finance.round_amount(iva),
        "total": logic.finance.round_amount(amt + iva)
    }


def summary_by_user(user_id):
    sql = "SELECT status, COUNT(*) AS c FROM refunds WHERE user_id = " + str(user_id) + " GROUP BY status"
    rows = db.query(sql)
    out = {"user_id": user_id, "buckets": {}}
    for r in rows:
        out['buckets'][r['status'] or 'unknown'] = r['c']
    return out


def total_refunded_amount(user_id):
    rows = db.query("SELECT amount FROM refunds WHERE user_id = ? AND status IN ('Approved', 'aprobada', 'done')", (user_id,))
    total = 0.0
    for r in rows:
        try:
            total += float(r['amount'])
        except (ValueError, TypeError):
            pass
    return {"user_id": user_id, "total": total}


def _now_iso():
    return datetime.datetime.utcnow().isoformat()
