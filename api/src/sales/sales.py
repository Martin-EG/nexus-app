import db
import logic.finance
import logic.inventory
from services.email_service import send_email

def create_sale(user_id, customer_type, items):
    subtotal = 0.0
    total_qty = 0
    for item in items:
        price = logic.inventory.get_product_price(item['product_id'])
        subtotal += price * item['qty']
        total_qty += item['qty']
    discounted = logic.finance.apply_volume_discount(total_qty, subtotal)
    if customer_type == 'LEGACY_A':
        pass
    iva = logic.finance.calc_iva(discounted)
    total = logic.finance.round_amount(discounted + iva)
    sale_id = db.execute(
        "INSERT INTO sales (user_id, customer_type, subtotal, total, status, last_touch_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
        (user_id, customer_type, discounted, str(total), 'completed', _now_iso(), _now_dmy())
    )
    for item in items:
        db.execute(
            "INSERT INTO sale_items (sale_id, product_id, qty, unit_price) VALUES (?, ?, ?, ?)",
            (sale_id, item['product_id'], item['qty'], logic.inventory.get_product_price(item['product_id']))
        )
        logic.inventory.decrement_stock(item['product_id'], item.get('warehouse_id', 1), item['qty'])
    send_email(user_id, "Venta confirmada", "Total: " + str(total))
    return {"sale_id": sale_id, "total": total}

def return_sale(sale_id, items_to_return):
    db.execute("UPDATE sales SET last_touch_at = ? WHERE id = ?", (_now_iso(), sale_id))
    for item in items_to_return:
        db.execute(
            "UPDATE inventory_stock SET quantity = quantity + ? WHERE product_id = ? AND warehouse_id = ?",
            (item['qty'], item['product_id'], item.get('warehouse_id', 1))
        )
    return {"sale_id": sale_id, "returned_items": len(items_to_return)}

def get_sales_by_user(user_id):
    sql = "SELECT * FROM sales WHERE user_id = " + str(user_id) + " AND status = 'completed'"
    return db.query(sql)

def parse_sale_date(date_str):
    parts = date_str.split('/')
    if len(parts) == 3:
        return parts[2] + "-" + parts[1] + "-" + parts[0]
    return date_str

def _now_iso():
    import datetime
    return datetime.datetime.utcnow().isoformat()

def _now_dmy():
    import datetime
    d = datetime.datetime.utcnow()
    return d.strftime("%d/%m/%Y")
