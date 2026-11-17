document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const jobId = urlParams.get('id');

    if (!jobId) {
        alert('Không tìm thấy mã công việc!');
        return;
    }

    // 1. Gọi API lấy chi tiết công việc
    try {
        const response = await fetch(`/api/v1/job-detail/${jobId}`);
        const result = await response.json();
        
        if (result.success) {
            const job = result.data;
            document.getElementById('job-title').innerText = job.title;
            document.getElementById('job-description').innerHTML = job.description;
            document.getElementById('job-salary').innerText = `Mức lương: ${job.salary}`;
            document.getElementById('job-location').innerText = `Địa điểm: ${job.location_name}`;
            
            const skillsList = document.getElementById('job-skills-list');
            skillsList.innerHTML = job.skills.map(skill => `<li>${skill}</li>`).join('');
        }
    } catch (err) {
        console.error('Lỗi tải dữ liệu:', err);
    }

    // 2. Xử lý hiển thị Modal nộp hồ sơ
    const modal = document.getElementById('apply-modal');
    document.getElementById('btn-open-modal').onclick = () => modal.style.display = 'block';
    document.getElementById('btn-close-modal').onclick = () => modal.style.display = 'none';

    // 3. Xử lý Validate form và gửi dữ liệu
    document.getElementById('apply-form').onsubmit = async (e) => {
        e.preventDefault();
        const fileInput = document.getElementById('cv-file');
        const file = fileInput.files[0];

        // Kiểm tra dung lượng file <= 5MB
        const maxSize = 5 * 1024 * 1024; 
        if (file.size > maxSize) {
            alert('Dung lượng file vượt quá giới hạn 5MB! Vui lòng chọn file nhỏ hơn.');
            return;
        }

        const formData = new FormData();
        formData.append('resume', file);
        formData.append('cover_letter', document.getElementById('cover-letter').value);
        formData.append('candidate_id', 1);

        try {
            const res = await fetch(`/api/v1/job-detail/${jobId}/apply`, {
                method: 'POST',
                body: formData
            });
            const data = await res.json();

            if (res.ok) {
                window.location.href = `apply-success.html?id=${jobId}`;
            } else {
                alert(data.error);
            }
        } catch (err) {
            console.error('Lỗi khi nộp đơn:', err);
        }
    };
});