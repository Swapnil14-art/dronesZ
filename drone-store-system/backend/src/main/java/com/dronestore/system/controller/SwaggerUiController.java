package com.dronestore.system.controller;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class SwaggerUiController {

    @GetMapping(value = "/swagger-ui.html", produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<String> getSwaggerUiHtml() {
        String html = "<!DOCTYPE html>\n" +
                "<html lang=\"en\">\n" +
                "<head>\n" +
                "    <meta charset=\"UTF-8\">\n" +
                "    <title>Drone Store API Explorer (Swagger UI)</title>\n" +
                "    <style>\n" +
                "        :root {\n" +
                "            --primary: #e52b31;\n" +
                "            --bg: #0f172a;\n" +
                "            --card: #1e293b;\n" +
                "            --border: #334155;\n" +
                "            --text: #f8fafc;\n" +
                "            --muted: #94a3b8;\n" +
                "            --green: #10b981;\n" +
                "            --blue: #3b82f6;\n" +
                "            --amber: #f59e0b;\n" +
                "        }\n" +
                "        body {\n" +
                "            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;\n" +
                "            background: var(--bg);\n" +
                "            color: var(--text);\n" +
                "            margin: 0;\n" +
                "            padding: 2rem;\n" +
                "        }\n" +
                "        .container {\n" +
                "            max-width: 1100px;\n" +
                "            margin: 0 auto;\n" +
                "        }\n" +
                "        header {\n" +
                "            background: var(--card);\n" +
                "            border: 1px solid var(--border);\n" +
                "            border-top: 4px solid var(--primary);\n" +
                "            border-radius: 12px;\n" +
                "            padding: 1.5rem 2rem;\n" +
                "            margin-bottom: 2rem;\n" +
                "            display: flex;\n" +
                "            justify-content: space-between;\n" +
                "            align-items: center;\n" +
                "        }\n" +
                "        .title {\n" +
                "            font-size: 1.5rem;\n" +
                "            font-weight: 700;\n" +
                "        }\n" +
                "        .title span {\n" +
                "            color: var(--primary);\n" +
                "        }\n" +
                "        .auth-box {\n" +
                "            background: var(--card);\n" +
                "            border: 1px solid var(--border);\n" +
                "            border-radius: 10px;\n" +
                "            padding: 1rem 1.5rem;\n" +
                "            margin-bottom: 2rem;\n" +
                "            display: flex;\n" +
                "            gap: 1rem;\n" +
                "            align-items: center;\n" +
                "        }\n" +
                "        input, select, textarea {\n" +
                "            background: #0f172a;\n" +
                "            border: 1px solid var(--border);\n" +
                "            color: #fff;\n" +
                "            padding: 0.6rem 1rem;\n" +
                "            border-radius: 6px;\n" +
                "            font-size: 0.9rem;\n" +
                "            outline: none;\n" +
                "        }\n" +
                "        button {\n" +
                "            background: var(--primary);\n" +
                "            color: #fff;\n" +
                "            border: none;\n" +
                "            padding: 0.6rem 1.25rem;\n" +
                "            border-radius: 6px;\n" +
                "            font-weight: 600;\n" +
                "            cursor: pointer;\n" +
                "        }\n" +
                "        button:hover { opacity: 0.9; }\n" +
                "        .api-card {\n" +
                "            background: var(--card);\n" +
                "            border: 1px solid var(--border);\n" +
                "            border-radius: 10px;\n" +
                "            margin-bottom: 1rem;\n" +
                "            overflow: hidden;\n" +
                "        }\n" +
                "        .api-header {\n" +
                "            padding: 1rem 1.5rem;\n" +
                "            display: flex;\n" +
                "            justify-content: space-between;\n" +
                "            align-items: center;\n" +
                "            cursor: pointer;\n" +
                "            font-weight: 600;\n" +
                "        }\n" +
                "        .method {\n" +
                "            font-size: 0.8rem;\n" +
                "            font-weight: 800;\n" +
                "            padding: 0.25rem 0.6rem;\n" +
                "            border-radius: 4px;\n" +
                "            margin-right: 0.75rem;\n" +
                "        }\n" +
                "        .GET { background: rgba(59, 130, 246, 0.2); color: var(--blue); border: 1px solid var(--blue); }\n" +
                "        .POST { background: rgba(16, 185, 129, 0.2); color: var(--green); border: 1px solid var(--green); }\n" +
                "        .PUT { background: rgba(245, 158, 11, 0.2); color: var(--amber); border: 1px solid var(--amber); }\n" +
                "        .DELETE { background: rgba(229, 43, 49, 0.2); color: var(--primary); border: 1px solid var(--primary); }\n" +
                "        .api-body {\n" +
                "            padding: 1.25rem 1.5rem;\n" +
                "            border-top: 1px solid var(--border);\n" +
                "            background: #0f172a;\n" +
                "        }\n" +
                "        pre {\n" +
                "            background: #020617;\n" +
                "            padding: 1rem;\n" +
                "            border-radius: 6px;\n" +
                "            border: 1px solid var(--border);\n" +
                "            overflow-x: auto;\n" +
                "            color: #38bdf8;\n" +
                "            font-size: 0.85rem;\n" +
                "        }\n" +
                "    </style>\n" +
                "</head>\n" +
                "<body>\n" +
                "    <div class=\"container\">\n" +
                "        <header>\n" +
                "            <div>\n" +
                "                <div class=\"title\">Drones<span>Z</span> Interactive API Explorer</div>\n" +
                "                <div style=\"color: var(--muted); font-size: 0.85rem; margin-top: 0.2rem;\">Live Spring Boot REST API Documentation (Supabase PostgreSQL)</div>\n" +
                "            </div>\n" +
                "            <a href=\"http://localhost:3000\" style=\"color: var(--primary); text-decoration: none; font-weight: 600; font-size: 0.9rem;\">Open Admin UI (Port 3000) &rarr;</a>\n" +
                "        </header>\n" +
                "\n" +
                "        <div class=\"auth-box\">\n" +
                "            <span style=\"font-size: 0.9rem; font-weight: 600;\">JWT Token:</span>\n" +
                "            <input type=\"text\" id=\"jwtInput\" placeholder=\"Paste Bearer token here...\" style=\"flex: 1;\">\n" +
                "            <button onclick=\"saveToken()\">Set Token</button>\n" +
                "            <span id=\"tokenStatus\" style=\"font-size: 0.8rem; color: var(--muted);\"></span>\n" +
                "        </div>\n" +
                "\n" +
                "        <h2 style=\"font-size: 1.2rem; color: var(--muted); margin-bottom: 1rem;\">1. AUTHENTICATION APIs</h2>\n" +
                "\n" +
                "        <div class=\"api-card\">\n" +
                "            <div class=\"api-header\" onclick=\"toggle('auth-login')\">\n" +
                "                <div><span class=\"method POST\">POST</span> <code>/api/auth/admin/login</code> - Admin Login</div>\n" +
                "            </div>\n" +
                "            <div id=\"auth-login\" class=\"api-body\">\n" +
                "                <p style=\"font-size: 0.85rem; color: var(--muted);\">Authenticates initial admin user and acquires JWT Bearer token.</p>\n" +
                "                <div style=\"display: flex; gap: 0.5rem; margin-bottom: 1rem;\">\n" +
                "                    <input type=\"email\" id=\"loginEmail\" value=\"admin@example.com\" placeholder=\"Email\">\n" +
                "                    <input type=\"password\" id=\"loginPassword\" value=\"AdminPassword123!\" placeholder=\"Password\">\n" +
                "                    <button onclick=\"executeLogin()\">Execute Login & Auto-Set Token</button>\n" +
                "                </div>\n" +
                "                <pre id=\"loginResult\">Result will appear here...</pre>\n" +
                "            </div>\n" +
                "        </div>\n" +
                "\n" +
                "        <div class=\"api-card\">\n" +
                "            <div class=\"api-header\" onclick=\"toggle('auth-me')\">\n" +
                "                <div><span class=\"method GET\">GET</span> <code>/api/admin/me</code> - Current Admin Profile</div>\n" +
                "            </div>\n" +
                "            <div id=\"auth-me\" class=\"api-body\">\n" +
                "                <button onclick=\"executeGet('/api/admin/me', 'meResult')\">Execute Request</button>\n" +
                "                <pre id=\"meResult\">Result will appear here...</pre>\n" +
                "            </div>\n" +
                "        </div>\n" +
                "\n" +
                "        <h2 style=\"font-size: 1.2rem; color: var(--muted); margin-top: 2rem; margin-bottom: 1rem;\">2. CATEGORIES APIs</h2>\n" +
                "\n" +
                "        <div class=\"api-card\">\n" +
                "            <div class=\"api-header\" onclick=\"toggle('cat-get-all')\">\n" +
                "                <div><span class=\"method GET\">GET</span> <code>/api/admin/categories</code> - Get All Categories</div>\n" +
                "            </div>\n" +
                "            <div id=\"cat-get-all\" class=\"api-body\">\n" +
                "                <button onclick=\"executeGet('/api/admin/categories', 'catGetAllResult')\">Execute GET Categories</button>\n" +
                "                <pre id=\"catGetAllResult\">Result will appear here...</pre>\n" +
                "            </div>\n" +
                "        </div>\n" +
                "\n" +
                "        <div class=\"api-card\">\n" +
                "            <div class=\"api-header\" onclick=\"toggle('cat-create')\">\n" +
                "                <div><span class=\"method POST\">POST</span> <code>/api/admin/categories</code> - Create Category</div>\n" +
                "            </div>\n" +
                "            <div id=\"cat-create\" class=\"api-body\">\n" +
                "                <textarea id=\"catPostPayload\" style=\"width: 100%; height: 80px; margin-bottom: 1rem;\">{\n  \"name\": \"Gimbals\",\n  \"description\": \"3-Axis FPV Gimbals\"\n}</textarea>\n" +
                "                <button onclick=\"executePost('/api/admin/categories', 'catPostPayload', 'catPostResult')\">Execute POST Category</button>\n" +
                "                <pre id=\"catPostResult\">Result will appear here...</pre>\n" +
                "            </div>\n" +
                "        </div>\n" +
                "\n" +
                "        <h2 style=\"font-size: 1.2rem; color: var(--muted); margin-top: 2rem; margin-bottom: 1rem;\">3. PRODUCTS APIs</h2>\n" +
                "\n" +
                "        <div class=\"api-card\">\n" +
                "            <div class=\"api-header\" onclick=\"toggle('prod-get-all')\">\n" +
                "                <div><span class=\"method GET\">GET</span> <code>/api/admin/products</code> - Get Products Catalog (Filtered)</div>\n" +
                "            </div>\n" +
                "            <div id=\"prod-get-all\" class=\"api-body\">\n" +
                "                <div style=\"display: flex; gap: 0.5rem; margin-bottom: 1rem;\">\n" +
                "                    <input type=\"text\" id=\"prodSearch\" placeholder=\"Search term...\">\n" +
                "                    <select id=\"prodStatus\">\n" +
                "                        <option value=\"\">All Statuses</option>\n" +
                "                        <option value=\"AVAILABLE\">AVAILABLE</option>\n" +
                "                        <option value=\"OUT_OF_STOCK\">OUT_OF_STOCK</option>\n" +
                "                        <option value=\"COMING_SOON\">COMING_SOON</option>\n" +
                "                    </select>\n" +
                "                    <button onclick=\"fetchFilteredProducts()\">Execute GET Products</button>\n" +
                "                </div>\n" +
                "                <pre id=\"prodGetAllResult\">Result will appear here...</pre>\n" +
                "            </div>\n" +
                "        </div>\n" +
                "\n" +
                "        <div class=\"api-card\">\n" +
                "            <div class=\"api-header\" onclick=\"toggle('prod-create')\">\n" +
                "                <div><span class=\"method POST\">POST</span> <code>/api/admin/products</code> - Create Product</div>\n" +
                "            </div>\n" +
                "            <div id=\"prod-create\" class=\"api-body\">\n" +
                "                <textarea id=\"prodPostPayload\" style=\"width: 100%; height: 160px; margin-bottom: 1rem;\">{\n  \"name\": \"Apex FPV Drone Motor 2207\",\n  \"description\": \"6S FPV Motor\",\n  \"price\": 1899.99,\n  \"quantity\": 50,\n  \"status\": \"AVAILABLE\"\n}</textarea>\n" +
                "                <button onclick=\"executePost('/api/admin/products', 'prodPostPayload', 'prodPostResult')\">Execute POST Product</button>\n" +
                "                <pre id=\"prodPostResult\">Result will appear here...</pre>\n" +
                "            </div>\n" +
                "        </div>\n" +
                "    </div>\n" +
                "\n" +
                "    <script>\n" +
                "        let jwtToken = localStorage.getItem('drone_jwt') || '';\n" +
                "        if (jwtToken) {\n" +
                "            document.getElementById('jwtInput').value = jwtToken;\n" +
                "            document.getElementById('tokenStatus').innerText = 'Token set in session';\n" +
                "        }\n" +
                "\n" +
                "        function saveToken() {\n" +
                "            jwtToken = document.getElementById('jwtInput').value.trim();\n" +
                "            localStorage.setItem('drone_jwt', jwtToken);\n" +
                "            document.getElementById('tokenStatus').innerText = jwtToken ? 'Token set successfully!' : 'Token cleared';\n" +
                "        }\n" +
                "\n" +
                "        function toggle(id) {\n" +
                "            const el = document.getElementById(id);\n" +
                "            el.style.display = el.style.display === 'none' ? 'block' : 'none';\n" +
                "        }\n" +
                "\n" +
                "        async function executeLogin() {\n" +
                "            const email = document.getElementById('loginEmail').value;\n" +
                "            const password = document.getElementById('loginPassword').value;\n" +
                "            const res = await fetch('/api/auth/admin/login', {\n" +
                "                method: 'POST',\n" +
                "                headers: { 'Content-Type': 'application/json' },\n" +
                "                body: JSON.stringify({ email, password })\n" +
                "            });\n" +
                "            const data = await res.json();\n" +
                "            document.getElementById('loginResult').innerText = JSON.stringify(data, null, 2);\n" +
                "            if (data.token) {\n" +
                "                jwtToken = data.token;\n" +
                "                document.getElementById('jwtInput').value = jwtToken;\n" +
                "                localStorage.setItem('drone_jwt', jwtToken);\n" +
                "                document.getElementById('tokenStatus').innerText = 'Auto-authenticated!';\n" +
                "            }\n" +
                "        }\n" +
                "\n" +
                "        async function executeGet(url, targetId) {\n" +
                "            const headers = { 'Content-Type': 'application/json' };\n" +
                "            if (jwtToken) headers['Authorization'] = 'Bearer ' + jwtToken;\n" +
                "            const res = await fetch(url, { headers });\n" +
                "            const data = await res.json().catch(() => ({ status: res.status, text: 'No JSON' }));\n" +
                "            document.getElementById(targetId).innerText = JSON.stringify(data, null, 2);\n" +
                "        }\n" +
                "\n" +
                "        async function executePost(url, payloadId, targetId) {\n" +
                "            const headers = { 'Content-Type': 'application/json' };\n" +
                "            if (jwtToken) headers['Authorization'] = 'Bearer ' + jwtToken;\n" +
                "            const bodyText = document.getElementById(payloadId).value;\n" +
                "            const res = await fetch(url, {\n" +
                "                method: 'POST',\n" +
                "                headers,\n" +
                "                body: bodyText\n" +
                "            });\n" +
                "            const data = await res.json().catch(() => ({ status: res.status }));\n" +
                "            document.getElementById(targetId).innerText = JSON.stringify(data, null, 2);\n" +
                "        }\n" +
                "\n" +
                "        async function fetchFilteredProducts() {\n" +
                "            const search = document.getElementById('prodSearch').value;\n" +
                "            const status = document.getElementById('prodStatus').value;\n" +
                "            const params = new URLSearchParams();\n" +
                "            if (search) params.append('search', search);\n" +
                "            if (status) params.append('status', status);\n" +
                "            await executeGet('/api/admin/products?' + params.toString(), 'prodGetAllResult');\n" +
                "        }\n" +
                "    </script>\n" +
                "</body>\n" +
                "</html>";

        return ResponseEntity.ok(html);
    }
}
