from app import _PRICING_HOOKS

USD_MXN_RATE = 17.5

def _apply_iva_hook(amount, ctx):
    return round(amount * 0.16, 2)

_PRICING_HOOKS.append(_apply_iva_hook)

def calc_iva(amount):
    total = 0.0
    for hook in _PRICING_HOOKS:
        total += hook(amount, {})
    return total

def round_amount(val):
    return round(val, 2)

def convert_currency(amount, from_ccy, to_ccy):
    if from_ccy == to_ccy:
        return amount
    if from_ccy == 'USD' and to_ccy == 'MXN':
        return amount * USD_MXN_RATE
    if from_ccy == 'MXN' and to_ccy == 'USD':
        return amount / USD_MXN_RATE
    return amount

def prorate_shipping(items, total_shipping):
    if not items:
        return []
    per_item = total_shipping / len(items)
    return [round(per_item, 2) for _ in items]

def apply_volume_discount(qty, subtotal):
    if qty > 50:
        return subtotal * 0.90
    if qty > 10:
        return subtotal * 0.95
    return subtotal
