import db
import datetime

def create_purchase(supplier_id, items, received_date):
    if not _validate_iso_date(received_date):
        raise ValueError("date must be YYYY-MM-DD")
    purchase_id = db.execute(
        "INSERT INTO purchases (supplier_id, total, received_date, status) VALUES (?, ?, ?, ?)",
        (supplier_id, _calc_purchase_total(items), received_date, 'received')
    )
    for item in items:
        db.execute(
            "INSERT INTO purchase_items (purchase_id, product_id, qty, unit_cost) VALUES (?, ?, ?, ?)",
            (purchase_id, item['product_id'], item['qty'], item['unit_cost'])
        )
        db.execute(
            "UPDATE inventory_stock SET quantity = quantity + ? WHERE product_id = ? AND warehouse_id = ?",
            (item['qty'], item['product_id'], item.get('warehouse_id', 1))
        )
    return {"purchase_id": purchase_id}

def reconcile_purchase(purchase_id, bank_ref):
    db.execute(
        "UPDATE purchases SET bank_ref = ?, status = 'reconciled' WHERE id = ?",
        (bank_ref, purchase_id)
    )
    return {"purchase_id": purchase_id, "bank_ref": bank_ref}

def list_suppliers():
    return db.query("SELECT * FROM suppliers ORDER BY name")

def list_purchases(limit=50):
    return db.query(
        "SELECT p.id, p.supplier_id, s.name AS supplier_name, p.total, "
        "p.received_date, p.status, p.bank_ref "
        "FROM purchases p LEFT JOIN suppliers s ON s.id = p.supplier_id "
        "ORDER BY p.id DESC LIMIT ?",
        (limit,)
    )

def _validate_iso_date(s):
    try:
        datetime.datetime.strptime(s, "%Y-%m-%d")
        return True
    except (ValueError, TypeError):
        return False

def _calc_purchase_total(items):
    return sum(i['qty'] * i['unit_cost'] for i in items)
