const express = require('express');
const router = express.Router();
const db = require('../config/database'); // Kết nối MySQL pool của bạn

// 1. API GET /api/v1/job-detail/:id
router.get('/:id', async (req, res) => {
    const jobId = req.params.id;
    try {
        const jobQuery = `
            SELECT j.*, c.company_name, c.logo_url, l.location_name, cat.category_name 
            FROM jobs j
            LEFT JOIN companies c ON j.company_id = c.id
            LEFT JOIN locations l ON j.location_id = l.id
            LEFT JOIN categories cat ON j.category_id = cat.id
            WHERE j.id = ? OR j.slug = ?
        `;
        const [jobs] = await db.execute(jobQuery, [jobId, jobId]);
        if (jobs.length === 0) return res.status(404).json({ error: 'Không tìm thấy việc làm' });
        
        const job = jobs[0];

        // Lấy danh sách kỹ năng yêu cầu từ bảng job_skills
        const [skills] = await db.execute(`
            SELECT s.skill_name FROM job_skills js
            JOIN skills s ON js.skill_id = s.id
            WHERE js.job_id = ?
        `, [job.id]);

        // Lấy 3 việc làm tương tự cùng ngành nghề
        const [similarJobs] = await db.execute(`
            SELECT id, title, salary, type FROM jobs 
            WHERE category_id = ? AND id != ? 
            LIMIT 3
        `, [job.category_id, job.id]);

        res.json({ success: true, data: { ...job, skills: skills.map(s => s.skill_name), similarJobs } });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Hàm kiểm tra Magic Bytes của file PDF (%PDF-)
function validatePdfMagicBytes(buffer) {
    if (!buffer || buffer.length < 4) return false;
    return buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46;
}

// 2. API POST /api/v1/job-detail/:id/apply
router.post('/:id/apply', async (req, res) => {
    const jobId = req.params.id;
    const { candidate_id, cover_letter, resume_buffer } = req.body; 
    
    try {
        if (resume_buffer && !validatePdfMagicBytes(Buffer.from(resume_buffer))) {
            return res.status(400).json({ error: 'Tệp tải lên không phải định dạng PDF hợp lệ!' });
        }

        const snapshotUrl = `/uploads/resumes/snapshot_${Date.now()}.pdf`;

        const query = `
            INSERT INTO applications (job_id, candidate_id, cover_letter, resume_snapshot_url, status)
            VALUES (?, ?, ?, ?, 'Pending')
        `;
        await db.execute(query, [jobId, candidate_id, cover_letter, snapshotUrl]);

        res.status(201).json({ success: true, message: 'Nộp hồ sơ thành công!' });
    } catch (error) {
        // Bắt lỗi trùng lặp ER_DUP_ENTRY (chống nộp 2 lần cho cùng 1 công việc)
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'Bạn đã nộp hồ sơ cho vị trí này trước đó rồi!' });
        }
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;