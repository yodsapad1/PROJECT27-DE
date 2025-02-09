const { MongoClient } = require('mongodb');

async function updateCreatedAt() {
    const uri = "mongodb+srv://JENG2004:7BlIDWwCcVQItxrf@cluster0.hq0l1.mongodb.net/"; // ให้แทนที่ด้วย MongoDB URI ของคุณ
    const client = new MongoClient(uri);

    try {
        await client.connect();
        const database = client.db("your_database_name"); // ให้แน่ใจว่าใช้ชื่อฐานข้อมูลที่ถูกต้อง
        const posts = database.collection("posts"); // ชื่อ collection ของโพสต์

        // อัปเดตเอกสารที่มี createdAt เป็น null
        const result = await posts.updateMany(
            { createdAt: null }, // ค้นหาซึ่งมีค่า createdAt เป็น null
            { $set: { createdAt: new Date() } } // ตั้งค่าวันที่ปัจจุบัน
        );

        console.log(`${result.modifiedCount} documents updated`);
    } finally {
        await client.close();
    }
}

// เรียกใช้ฟังก์ชัน
updateCreatedAt().catch(console.error);