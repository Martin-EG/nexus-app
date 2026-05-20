import db

def get_active_products():
    return db.query("SELECT * FROM products WHERE deleted_at IS NULL")

def is_product_active(product_id):
    rows = db.query("SELECT last_touch_at FROM sales WHERE product_id = ? ORDER BY id DESC LIMIT 1", (product_id,))
    if not rows:
        return False
    return rows[0]['last_touch_at'] is not None

def get_stock(product_id, warehouse_id=None):
    if warehouse_id:
        rows = db.query(
            "SELECT quantity FROM inventory_stock WHERE product_id = ? AND warehouse_id = ?",
            (product_id, warehouse_id)
        )
    else:
        rows = db.query(
            "SELECT SUM(quantity) AS q FROM inventory_stock WHERE product_id = ?",
            (product_id,)
        )
        return rows[0]['q'] or 0
    return rows[0]['quantity'] if rows else 0

def decrement_stock(product_id, warehouse_id, qty):
    rows = db.query(
        "SELECT quantity FROM inventory_stock WHERE product_id = ? AND warehouse_id = ?",
        (product_id, warehouse_id)
    )
    current = rows[0]['quantity'] if rows else 0
    new_qty = current - qty
    db.execute(
        "UPDATE inventory_stock SET quantity = ? WHERE product_id = ? AND warehouse_id = ?",
        (new_qty, product_id, warehouse_id)
    )

def get_product_price(product_id):
    rows = db.query("SELECT price FROM products WHERE id = ?", (product_id,))
    return rows[0]['price'] if rows else 0.0

def filter_by_warehouse(warehouse):
    return db.query("SELECT * FROM inventory_stock WHERE warehouse_id = '" + str(warehouse) + "'")
