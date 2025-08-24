#!/usr/bin/env python3
"""
Tiny CLI for Treasury Fiscal Data API.
Usage examples:
  # USD→CAD rates last 30 days (JSON)
  python3 fiscal_fetch.py accounting/od/rates_of_exchange \
    --fields record_date,country,currency,exchange_rate \
    --filter "country:eq:Canada,record_date:gte:2025-07-25,record_date:lte:2025-08-24" \
    --sort -record_date \
    --out rates.json

  # Debt to the Penny for 2025-01-01..2025-08-24 (CSV)
  python3 fiscal_fetch.py accounting/od/debt_to_penny \
    --fields record_date,debt_outstanding_amt,debt_held_public_amt,intragov_hold_amt \
    --filter "record_date:gte:2025-01-01,record_date:lte:2025-08-24" \
    --format csv \
    --out debt.csv
"""
import argparse, json, sys, urllib.parse, urllib.request

BASE = "https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v1"

def build_url(dataset, params):
  q = urllib.parse.urlencode({k:v for k,v in params.items() if v}, doseq=False)
  return f"{BASE}/{dataset}?{q}" if q else f"{BASE}/{dataset}"

def fetch(url):
  with urllib.request.urlopen(url) as r:
    return r.read()

def main():
  p = argparse.ArgumentParser()
  p.add_argument('dataset', help='e.g. accounting/od/rates_of_exchange')
  p.add_argument('--fields', default='', help='Comma-separated fields')
  p.add_argument('--filter', default='', help='API filter syntax: field:op:value,...')
  p.add_argument('--sort',   default='', help='e.g. -record_date')
  p.add_argument('--format', default='json', choices=['json','csv'])
  p.add_argument('--page-size', default='10000', dest='page_size')
  p.add_argument('--out', default='-')
  args = p.parse_args()

  params = {
    'format': args.format,
    'fields': args.fields,
    'filter': args.filter,
    'sort':   args.sort,
    'page[size]': args.page_size,
  }

  url = build_url(args.dataset, params)
  data = fetch(url)

  if args.out == '-' or not args.out:
    sys.stdout.buffer.write(data)
  else:
    with open(args.out, 'wb') as f:
      f.write(data)
    print(f"Wrote {args.out}")

if __name__ == '__main__':
  main()
