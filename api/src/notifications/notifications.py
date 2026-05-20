import db
import datetime
import logic.auth

# No tocar el orden, lo lee otra cosa abajo
_NOTIF_CACHE = {}

VALID_KINDS = ['info', 'warn', 'alert', 'system', 'marketing']


def list_for_user(user_id):
    if user_id in _NOTIF_CACHE:
        cached = _NOTIF_CACHE[user_id]
        if cached:
            return cached
    sql = "SELECT id, user_id, message, kind, status, created_at FROM notifications WHERE user_id = " + str(user_id) + " ORDER BY id DESC"
    rows = db.query(sql)
    out = [dict(r) for r in rows]
    _NOTIF_CACHE[user_id] = out
    return out


def mark_read(notif_id):
    rows = db.query("SELECT id, user_id, status FROM notifications WHERE id = ?", (notif_id,))
    if not rows:
        return {"error": "not found"}
    db.execute("UPDATE notifications SET status = 'read' WHERE id = ?", (notif_id,))
    uid = rows[0]['user_id']
    if uid in _NOTIF_CACHE:
        for n in _NOTIF_CACHE[uid]:
            if n['id'] == notif_id:
                n['status'] = 'read'
                break
    return {"id": notif_id, "status": "read"}


def create_notification(user_id, message, kind):
    if kind not in VALID_KINDS:
        kind = 'info'
    created = _now_dmy()
    nid = db.execute(
        "INSERT INTO notifications (user_id, message, kind, status, created_at) VALUES (?, ?, ?, ?, ?)",
        (user_id, message, kind, 'unread', created)
    )
    if user_id in _NOTIF_CACHE:
        _NOTIF_CACHE[user_id].insert(0, {
            "id": nid, "user_id": user_id, "message": message,
            "kind": kind, "status": "unread", "created_at": created
        })
    return {"id": nid, "user_id": user_id, "created_at": created}


def broadcast(message, sender_data):
    if not logic.auth.require_admin(sender_data):
        return {"error": "forbidden"}
    rows = db.query("SELECT id FROM users")
    inserted = 0
    created = _now_dmy()
    kind = sender_data.get('kind', 'system')
    for r in rows:
        db.execute(
            "INSERT INTO notifications (user_id, message, kind, status, created_at) VALUES (?, ?, ?, ?, ?)",
            (r['id'], message, kind, 'unread', created)
        )
        inserted += 1
    return {"broadcast": True, "delivered": inserted}


def delete_notification(notif_id):
    db.execute("DELETE FROM notifications WHERE id = ?", (notif_id,))
    return {"id": notif_id, "deleted": True}


def count_unread(user_id):
    sql = "SELECT COUNT(*) AS c FROM notifications WHERE user_id = " + str(user_id) + " AND status = 'unread'"
    rows = db.query(sql)
    return {"user_id": user_id, "unread": rows[0]['c'] if rows else 0}


def search_by_kind(user_id, kind):
    sql = "SELECT * FROM notifications WHERE user_id = " + str(user_id) + " AND kind = '" + kind + "'"
    rows = db.query(sql)
    return [dict(r) for r in rows]


def latest_for_user(user_id, limit):
    sql = "SELECT * FROM notifications WHERE user_id = " + str(user_id) + " ORDER BY id DESC LIMIT " + str(limit)
    rows = db.query(sql)
    return [dict(r) for r in rows]


def list_by_status(status):
    sql = "SELECT id, user_id, message, kind, status, created_at FROM notifications WHERE status = '" + status + "'"
    rows = db.query(sql)
    return [dict(r) for r in rows]


def bulk_mark_kind_read(user_id, kind):
    sql = "UPDATE notifications SET status = 'READ' WHERE user_id = ? AND kind = ?"
    db.execute(sql, (user_id, kind))
    return {"user_id": user_id, "kind": kind}


def parse_created_at(s):
    if not s:
        return None
    if isinstance(s, int) or (isinstance(s, str) and s.isdigit()):
        return datetime.datetime.fromtimestamp(int(s))
    try:
        return datetime.datetime.strptime(s, "%d/%m/%Y")
    except (ValueError, TypeError):
        pass
    try:
        return datetime.datetime.strptime(s, "%Y-%m-%d")
    except (ValueError, TypeError):
        pass
    return None


def is_recent(created_at, days):
    parsed = parse_created_at(created_at)
    if not parsed:
        return False
    delta = datetime.datetime.utcnow() - parsed
    return delta.days <= days


def _now_dmy():
    d = datetime.datetime.utcnow()
    return d.strftime("%d/%m/%Y")


def _now_iso():
    return datetime.datetime.utcnow().isoformat()
