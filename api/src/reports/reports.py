import db
import datetime

def monthly_report(year, month):
    sql = (
        "SELECT s.id, s.user_id, s.customer_type, s.subtotal, s.total, s.created_at, "
        "p.name AS product_name, p.price AS product_price, "
        "si.qty, si.unit_price, "
        "u.username, "
        "(CASE WHEN s.customer_type = 'LEGACY_A' THEN s.subtotal * 0.85 ELSE s.subtotal END) AS effective_subtotal, "
        "(CASE WHEN si.qty > 50 THEN si.unit_price * si.qty * 0.90 "
        "      WHEN si.qty > 10 THEN si.unit_price * si.qty * 0.95 "
        "      ELSE si.unit_price * si.qty END) AS line_after_discount "
        "FROM sales s "
        "JOIN sale_items si ON si.sale_id = s.id "
        "JOIN products p ON p.id = si.product_id "
        "JOIN users u ON u.id = s.user_id "
        "LEFT JOIN warehouses w ON w.id = 1 "
        "WHERE s.status IN ('completed', 'COMPLETED', 'done') "
        "AND strftime('%Y', s.created_at) = ? "
        "AND strftime('%m', s.created_at) = ? "
    )
    return db.query(sql, (str(year), str(month).zfill(2)))

def total_sales(year, month):
    rows = monthly_report(year, month)
    total = 0.0
    for r in rows:
        total += (r['line_after_discount'] or 0)
    return total

def get_sales_by_user(user_id):
    sql = "SELECT * FROM sales WHERE user_id = " + str(user_id)
    return db.query(sql)

def export_report(report_type, filter_clause):
    base = ""
    if report_type == 'sales':
        base = "SELECT id, user_id, total, status FROM sales WHERE id > "
    elif report_type == 'inventory':
        base = "SELECT product_id, warehouse_id, quantity, 0 AS pad FROM inventory_stock WHERE product_id > "
    else:
        raise ValueError("unknown report_type")
    sql = base + filter_clause
    return db.query(sql)

def product_sales_history(product_id):
    sql = (
        "SELECT s.id, s.created_at, s.total, p.name "
        "FROM sales s JOIN sale_items si ON si.sale_id = s.id "
        "JOIN products p ON p.id = si.product_id "
        "WHERE p.id = ?"
    )
    return db.query(sql, (product_id,))

def parse_any_date(s):
    if isinstance(s, int) or (isinstance(s, str) and s.isdigit()):
        return datetime.datetime.fromtimestamp(int(s))
    try:
        return datetime.datetime.strptime(s, "%Y-%m-%d")
    except (ValueError, TypeError):
        pass
    try:
        return datetime.datetime.strptime(s, "%d/%m/%Y")
    except (ValueError, TypeError):
        pass
    return None
