import csv, json, os, html
from datetime import datetime
from http.server import SimpleHTTPRequestHandler, HTTPServer

os.chdir(os.path.dirname(os.path.abspath(__file__)))

FILE = "results.csv"
HEAD = ["Time", "Name", "StudentID", "Difficulty", "Attempt1", "Attempt2", "Attempt3", "BestMs"]

def read_rows():
    rows = []
    for path in (FILE, "results_backup.csv"):
        if os.path.exists(path):
            try:
                with open(path, newline="", encoding="utf-8-sig") as f:
                    rows += list(csv.reader(f))[1:]
            except PermissionError:
                pass
    def key(r):
        try:
            return int(r[7])
        except Exception:
            return 10**9
    return sorted(rows, key=key)

def view_page():
    rows = read_rows()
    body = ""
    for i, r in enumerate(rows, 1):
        cells = [str(i)] + [html.escape(c) for c in r]
        body += "<tr>" + "".join(f"<td>{c}</td>" for c in cells) + "</tr>"
    head = "".join(f"<th>{h}</th>" for h in ["Rank"] + HEAD)
    return f"""<html><head><meta charset="utf-8">
<meta http-equiv="refresh" content="3">
<style>body{{font-family:sans-serif;padding:16px}}
table{{border-collapse:collapse;width:100%}}
td,th{{border:1px solid #ccc;padding:6px 10px;text-align:left}}
th{{background:#eee}} tr:nth-child(2){{background:#fff3c4;font-weight:bold}}</style></head><body>
<h3>Leaderboard - {len(rows)} participants (fastest first)</h3>
<table><tr>{head}</tr>{body}</table></body></html>"""

class Handler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def do_GET(self):
        if self.path == "/view":
            data = view_page().encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.end_headers()
            self.wfile.write(data)
        else:
            super().do_GET()

    def do_POST(self):
        if self.path != "/save":
            self.send_error(404)
            return
        try:
            length = int(self.headers.get("Content-Length", 0))
            d = json.loads(self.rfile.read(length))
            a = (d.get("attempts", []) + ["", "", ""])[:3]
            row = [datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                   d.get("name", ""), d.get("studentId", ""),
                   d.get("difficulty", ""), a[0], a[1], a[2], d.get("best", "")]
            saved = False
            for target in (FILE, "results_backup.csv"):
                try:
                    new = not os.path.exists(target)
                    with open(target, "a", newline="", encoding="utf-8-sig") as f:
                        w = csv.writer(f)
                        if new:
                            w.writerow(HEAD)
                        w.writerow(row)
                    saved = True
                    break
                except PermissionError:
                    print(target, "locked, trying backup")
            self.send_response(200 if saved else 500)
            self.end_headers()
            self.wfile.write(b"ok" if saved else b"fail")
        except Exception as e:
            print("Save error:", e)
            self.send_response(500)
            self.end_headers()

print("Serving folder:", os.getcwd())
print("Game: http://localhost:8000")
print("Live data: http://localhost:8000/view")
HTTPServer(("localhost", 8000), Handler).serve_forever()