// ================= CODEWAVE UNIT BACKEND =================
const express = require("express");
const nodemailer = require("nodemailer");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = "supersecureadminpass"; // change this securely

// ================= NODMAILER SETUP =================
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: "brightchibondo00@gmail.com", // your Gmail
        pass: "qsglwsxhnayflftk"            // Gmail app password
    }
});

// ================= IN-MEMORY DATA =================
const verificationCodes = {}; 
const users = {};             

// ================= RANDOM LOGIN MESSAGES =================
const loginMessages = [
    "⚡ Secure login successful — Welcome to Codewave Unit (Powered by Iconic Tech).",
    "🚀 Authentication complete! You are now connected with Codewave Unit — Innovated by Iconic Tech.",
    "🔑 Verified successfully. Experience the future with Codewave Unit — Crafted by Iconic Tech.",
    "✅ Access granted! Enjoy a seamless experience with Codewave Unit — Dev by Iconic Tech.",
    "🌐 Login complete. Thank you for choosing Codewave Unit — Technology by Iconic Tech."
];

// ================= SEND VERIFICATION CODE =================
app.post("/send-code", async (req, res) => {
    const { email, name } = req.body;
    if (!email) return res.status(400).json({ success: false, error: "Email required" });

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    verificationCodes[email] = code;

    const mailOptions = {
        from: '"Codewave Unit" <brightchibondo01@gmail.com>',
        to: email,
        subject: "🔐 Codewave Unit | Verification Code",
        html: `
        <div style="font-family:Segoe UI,Roboto,Arial,sans-serif; color:#1a1a1a; 
                    max-width:600px; margin:auto; border-radius:12px; 
                    border:1px solid #e5e5e5; background:#ffffff; padding:30px;">
            
            <div style="text-align:center;">
                <img src="https://files.catbox.moe/zpfvou.jpg" 
                     alt="Logo" style="width:80px; height:80px; border-radius:50%; margin-bottom:15px;"/>
                <h2 style="margin:10px 0; font-weight:600; color:#0d6efd;">
                    Codewave Unit Verification
                </h2>
            </div>
            
            <p style="font-size:15px; text-align:center;">
                Hi <b>${name || email}</b>,<br>
                Use the following code to complete your verification:
            </p>
            
            <div style="text-align:center; margin:20px 0;">
                <span style="font-size:30px; font-weight:bold; letter-spacing:3px; 
                             background:#f8f9fa; border:1px dashed #0d6efd; 
                             padding:12px 28px; border-radius:10px; display:inline-block;">
                    ${code}
                </span>
            </div>

            <p style="font-size:13px; color:#444; text-align:center;">
                ⚠️ Please do not share this code with anyone. It will expire soon.
            </p>
            
            <hr style="border:none; border-top:1px solid #eee; margin:25px 0;">
            
            <p style="font-size:13px; text-align:center; color:#666;">
                Developed & Secured by <b>Iconic Tech</b> | 
                <a href="https://codewave-unit.zone.id" style="color:#0d6efd; text-decoration:none;">Website</a> · 
                <a href="https://whatsapp.com/channel/0029ValX2Js9RZAVtDgMYj0r" style="color:#0d6efd; text-decoration:none;">Follow Us</a>
            </p>
        </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`📩 Verification code sent to ${email}: ${code}`);
        res.json({ success: true, message: "Verification code sent!" });
    } catch (err) {
        console.error("❌ Email sending error:", err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// ================= VERIFY CODE =================
app.post("/verify-code", async (req, res) => {
    const { email, code, name } = req.body;
    if (!email || !code) return res.status(400).json({ success: false, error: "Email and code required" });

    if (verificationCodes[email] && verificationCodes[email] === code) {
        delete verificationCodes[email];
        users[email] = {
            email,
            name: name || email,
            verified: true,
            banned: false,
            lastLogin: new Date().toISOString()
        };

        // Pick random professional login message
        const randomMsg = loginMessages[Math.floor(Math.random() * loginMessages.length)];

        // ✅ Send login confirmation email
        const loginMail = {
            from: '"Codewave Unit" <brightchibondo01@gmail.com>',
            to: email,
            subject: "✅ Codewave Unit | Login Successful",
            html: `
            <div style="font-family:Segoe UI,Roboto,Arial,sans-serif; color:#1a1a1a; 
                        max-width:600px; margin:auto; border-radius:12px; 
                        border:1px solid #e5e5e5; background:#ffffff; padding:30px;">
                
                <div style="text-align:center;">
                    <h2 style="margin:10px 0; font-weight:600; color:#198754;">
                        ${randomMsg}
                    </h2>
                </div>

                <p style="font-size:14px; text-align:center; color:#555;">
                    Welcome back <b>${name || email}</b>,<br>
                    You have successfully logged into <b>Codewave Unit</b>.
                </p>

                <div style="text-align:center; margin-top:20px;">
                    <a href="https://codewave-unit.zone.id" 
                       style="padding:12px 24px; background:#0d6efd; color:#fff; 
                              border-radius:6px; text-decoration:none; font-size:14px;">
                        Explore Dashboard
                    </a>
                </div>

                <hr style="border:none; border-top:1px solid #eee; margin:25px 0;">
                <p style="font-size:13px; text-align:center; color:#666;">
                    Developed with ❤️ by <b>Iconic Tech</b>
                </p>
            </div>
            `
        };

        try {
            await transporter.sendMail(loginMail);
            console.log(`📨 Login confirmation sent to ${email}`);
        } catch (err) {
            console.error("⚠️ Could not send login confirmation email:", err.message);
        }

        // API response
        return res.json({ success: true, message: randomMsg });
    } else {
        return res.status(400).json({ success: false, error: "Invalid verification code" });
    }
});

// ================= ADMIN MIDDLEWARE =================
function checkAdmin(req, res, next) {
    if (req.headers.password === ADMIN_PASSWORD) return next();
    res.status(403).json({ success: false, error: "Unauthorized" });
}

// ================= ADMIN ROUTES =================
app.get("/admin/users", checkAdmin, (req, res) => {
    res.json({ success: true, users: Object.values(users) });
});

// ================= START SERVER =================
app.listen(PORT, () => console.log(`🚀 Codewave Unit backend running on port ${PORT}`));