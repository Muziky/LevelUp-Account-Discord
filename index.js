import tokens from "./tokens.js";
import fs from 'fs';
import path from 'path';
import ms from 'ms';
import express from 'express';
const app = express();
const port = 3000;
let url = "";
let requests = 0;
let response = null;
app.use((req, res, next) => {
    const hostname = req.hostname;
    const subdomain = hostname.split('.')[0];
    const domain = hostname.replace(`${subdomain}.`, '');
    req.subdomain = subdomain;
    req.domain = domain;
    url = `https://${subdomain}.${domain}/`;
    next();
});
app.get('/', (req, res) => res.send('Hello World!'));
app.listen(port, () => console.log(`Example app listening at ${url}`));
process.on('uncaughtException', (err) => {
    console.error(`Uncaught Exception: ${err.message}`);
});
setInterval(async () => {
    console.log(url);
    try {
        response = await fetch(url, { method: 'HEAD' });
        requests += 1;
        console.log(`Request done with status ${response.status} ${requests}`);
    } catch (error) {
        if (error.response) {
            requests += 1;
            console.log(`Response status: ${error.response.status}${requests}`);
        }
    } finally {
        response = null;
    }
}, 15000);
let randomWords = [];
try {
    const wordsFilePath = path.join(process.cwd(), 'words.txt');
    const fileContent = fs.readFileSync(wordsFilePath, 'utf-8');
    randomWords = fileContent
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);
    
    console.log(`📝 تم تحميل ${randomWords.length} كلمة من ملف words.txt`);
} catch (error) {
    console.error('❌ خطأ في قراءة ملف words.txt:', error.message);
    console.log('💡 تأكد من وجود ملف words.txt في نفس المجلد');
    process.exit(1);
}

const MESSAGE_CONFIG = {
    channelId: "1442604146564796567",
    minInterval: ms('20s'),
    maxInterval: ms('40s'),
};

function getRandomInterval() {
    const min = MESSAGE_CONFIG.minInterval;
    const max = MESSAGE_CONFIG.maxInterval;
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function sendMessage(token, channelId, content) {
    try {
        const response = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
            method: 'POST',
            headers: {
                'Authorization': token,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ content })
        });

        if (response.ok) {
            console.log(`✅ تم إرسال الرسالة: "${content}"`);
            return true;
        } else {
            const error = await response.json();
            console.error('❌ خطأ في إرسال الرسالة:', error);
            return false;
        }
    } catch (error) {
        console.error('❌ خطأ في الاتصال:', error.message);
        return false;
    }
}

function getRandomMessage() {
    if (randomWords.length === 0) {
        console.error('❌ لا توجد كلمات في ملف words.txt');
        return 'مرحبا';
    }
    const randomIndex = Math.floor(Math.random() * randomWords.length);
    return randomWords[randomIndex];
}

process.on('uncaughtException', (err) => {
    console.error(`Uncaught Exception: ${err.message}`);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

const cleanTokens = tokens.reduce((acc, token) => {
    const isValid = token?.token?.length > 30;
    const isDuplicate = acc.some(t => t.token === token.token);
    if (isValid && !isDuplicate) {
        acc.push(token);
    } else {
        console.warn('Invalid or duplicate token configuration:', token);
    }
    return acc;
}, []);

console.log(`🚀 تم تحميل ${cleanTokens.length} توكن`);
console.log(`⚙️ الوقت العشوائي بين الرسائل: ${MESSAGE_CONFIG.minInterval / 1000}s - ${MESSAGE_CONFIG.maxInterval / 1000}s`);

async function startSendingMessages(token, channelId) {
    while (true) {
        try {
            const randomMessage = getRandomMessage();
            await sendMessage(token, channelId, randomMessage);
            
            const nextInterval = getRandomInterval();
            const nextTime = (nextInterval / 1000).toFixed(1);
            console.log(`⏰ الرسالة القادمة بعد: ${nextTime} ثانية`);
            
            await sleep(nextInterval);
        } catch (error) {
            console.error('❌ خطأ في حلقة الإرسال:', error.message);
            await sleep(5000); 
        }
    }
}

for (const tokenConfig of cleanTokens) {
    console.log(`✅ تم تفعيل إرسال الرسائل العشوائية للتوكن`);
    startSendingMessages(tokenConfig.token, MESSAGE_CONFIG.channelId);
}
