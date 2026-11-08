/**
 * ==========================================================================
 * MODULE 2: CHI TIẾT VIỆC LÀM & MODAL ỨNG TUYỂN (JOB DETAIL & APPLY MODAL)
 * --------------------------------------------------------------------------
 * Thành viên đảm nhiệm: HỒ TRÚC GIA HÂN
 * Mã số sinh viên (MSSV): 056306004131
 * Nhánh Git phát triển: ho_han (Đã merge vào main)
 * Học phần: Lập trình Website — GVHD: ThS. Trần Thịnh Mạnh Đức — Nhóm 6 UTH
 * Thiết kế chuẩn: Wireframe Mục 5.3 Bố cục 70/30 & Sticky Box (File QTTK.html)
 * 
 * PHẠM VI CHỨC NĂNG DO HỒ TRÚC GIA HÂN HIỆN THỰC HÓA:
 *   - Mục 1: Cơ sở dữ liệu chuyên sâu từng tin tuyển dụng (JOBS_DB)
 *   - Mục 2: Trích xuất ID công việc từ URL (parseUrlParams: ?id=job-01...)
 *   - Mục 3: Điền dữ liệu chi tiết lên giao diện (hydrateJobDetails)
 *   - Mục 4: Kiểm tra trạng thái đã nộp hồ sơ hay chưa từ localStorage
 *   - Mục 5: Điều khiển đóng / mở Cửa sổ Modal nộp hồ sơ (Apply Modal Dialog)
 *   - Mục 6: Xử lý sự kiện kéo & thả tệp CV định dạng PDF / Word (Drag & Drop)
 *   - Mục 7: Xử lý gửi đơn ứng tuyển, kiểm tra form và lưu bản chụp (Snapshot)
 *   - Mục 8: Tính năng Lưu / Bỏ lưu tin tuyển dụng (Bookmark Toggle)
 *   - Mục 9: Tính năng sao chép liên kết chia sẻ việc làm (Share Job Link)
 *   - Mục 10: Thuật toán gợi ý các cơ hội việc làm tương tự cùng ngành nghề
 *   - Mục 11: Khởi tạo dữ liệu và kích hoạt tương tác (Run Hydration)
 * ==========================================================================
 */

document.addEventListener('DOMContentLoaded', function () {
  'use strict';

  // --------------------------------------------------------------------------
  // 1. CƠ SỞ DỮ LIỆU CHI TIẾT VIỆC LÀM (CHUYÊN SÂU IT & DOANH NGHIỆP CÔNG NGHỆ)
  // --------------------------------------------------------------------------
  const JOBS_DB = {
    'job-01': {
      id: 'job-01',
      title: 'Frontend React Developer (Junior / Middle)',
      company: 'Công Ty Cổ Phần Công Nghệ VNG',
      logo: 'VNG',
      logoBg: 'linear-gradient(135deg, #ff6b4a 0%, #ff8e53 100%)',
      verified: true,
      isHot: true,
      salary: '15 - 22 Triệu',
      salarySub: 'Thương lượng theo năng lực phỏng vấn',
      location: 'Quận 7, TP.HCM',
      locationDetail: 'VNG Campus, Đường số 13, KCX Tân Thuận, Quận 7, TP. Hồ Chí Minh',
      workType: 'Toàn thời gian (Full-time)',
      experience: '1 - 3 năm kinh nghiệm',
      level: 'Junior / Middle Engineer',
      quantity: '03 Kỹ sư',
      postedDate: '24/10/2026',
      deadline: '25/11/2026',
      views: 428,
      category: 'software',
      tags: ['React', 'TypeScript', 'Redux Toolkit', 'TailwindCSS', 'Next.js'],
      recruiter: {
        name: 'Trần Thị Mai Anh',
        role: 'Senior Tech Recruiter — VNG Zing MP3 & Zalo',
        email: 'recruitment@vng.com.vn',
        phone: '028 3962 3888 (Ext: 104)'
      },
      companyOverview: {
        name: 'Công Ty Cổ Phần Công Nghệ VNG (VNG Corporation)',
        scale: '4.000+ nhân viên toàn cầu',
        founded: '2004 (22 năm phát triển)',
        headquarters: 'VNG Campus, Quận 7, TP.HCM',
        website: 'https://vng.com.vn',
        description: 'VNG là kỳ lân công nghệ đầu tiên tại Việt Nam, sở hữu hệ sinh thái sản phẩm dẫn đầu thị trường bao gồm Zalo, Zing MP3, ZaloPay và các tựa game nổi tiếng trên toàn cầu.'
      },
      description: [
        'Tham gia phát triển và tối ưu hóa giao diện cho hệ sinh thái sản phẩm Zalo Web và Zalo Mini App với hơn 75 triệu người dùng hoạt động hàng tháng.',
        'Hiện thực hóa các bản thiết kế UI/UX từ Figma thành mã nguồn sạch (Clean Code), áp dụng mô hình Modular Component và Design System chuẩn mực.',
        'Tối ưu hóa chỉ số hiệu năng tải trang Core Web Vitals (LCP, FID, CLS), đảm bảo tốc độ phản hồi dưới 100ms trên mọi trình duyệt hiện đại.',
        'Phối hợp chặt chẽ với đội ngũ Kỹ sư Backend (Node.js/Go) để định nghĩa và tích hợp các chuẩn RESTful API và WebSocket thời gian thực.'
      ],
      requirements: [
        'Tốt nghiệp Cao đẳng / Đại học chuyên ngành Công Nghệ Thông Tin, Kỹ Thuật Phần Mềm hoặc các ngành liên quan.',
        'Có từ 1 - 3 năm kinh nghiệm làm việc thực tế với JavaScript (ES6+), TypeScript và thư viện React.',
        'Thành thạo quản lý trạng thái ứng dụng với Redux Toolkit, Zustand hoặc React Context API.',
        'Nắm vững HTML5 Semantic, CSS3 hiện đại, Flexbox, CSS Grid và tiền xử lý TailwindCSS/SCSS.',
        'Kinh nghiệm làm việc với Git (Git Flow, Pull Request, Code Review) và hiểu biết cơ bản về CI/CD, Webpack hoặc Vite.',
        'Tinh thần trách nhiệm cao, chủ động trong công việc và khả năng đọc hiểu tài liệu kỹ thuật tiếng Anh tốt.'
      ],
      benefits: [
        { icon: '💰', title: 'Thu Nhập Hấp Dẫn', desc: '15 - 22 Triệu/tháng + Lương tháng 13 + Thưởng hiệu quả dự án hàng quý.' },
        { icon: '🏥', title: 'Bảo Hiểm Cao Cấp', desc: 'Gói bảo hiểm sức khỏe VNG Care toàn diện cho cá nhân và người thân.' },
        { icon: '💻', title: 'Thiết Bị Đỉnh Cao', desc: 'Cung cấp MacBook Pro M3 mới 100% cùng màn hình rời 4K cao cấp.' },
        { icon: '🍱', title: 'Ăn Uống Miễn Phí', desc: 'Căn-tin hiện đại phục vụ bữa sáng, trưa và cà phê/trà bánh miễn phí mỗi ngày.' },
        { icon: '🏋️', title: 'Phòng Gym & Hồ Bơi', desc: 'Khu thể thao, phòng gym tiêu chuẩn quốc tế và hồ bơi vô cực ngay tại Campus.' },
        { icon: '📚', title: 'Đào Tạo Chuyên Sâu', desc: 'Tài trợ 100% chi phí các khóa học AWS, GCP và chứng chỉ công nghệ quốc tế.' }
      ]
    },

    'job-02': {
      id: 'job-02',
      title: 'Junior Backend Node.js / NestJS Engineer',
      company: 'FPT Software Global',
      logo: 'FPT',
      logoBg: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
      verified: true,
      isHot: true,
      salary: '14 - 20 Triệu',
      salarySub: 'Xét tăng lương định kỳ 2 lần/năm',
      location: 'TP. Thủ Đức, TP.HCM',
      locationDetail: 'F-Town 3, Khu Công Nghệ Cao, TP. Thủ Đức, TP. Hồ Chí Minh',
      workType: 'Toàn thời gian (Full-time)',
      experience: '1 - 2 năm kinh nghiệm',
      level: 'Junior Backend Engineer',
      quantity: '05 Kỹ sư',
      postedDate: '23/10/2026',
      deadline: '30/11/2026',
      views: 385,
      category: 'software',
      tags: ['Node.js', 'NestJS', 'PostgreSQL', 'Docker', 'Redis', 'Microservices'],
      recruiter: {
        name: 'Nguyễn Hoàng Khang',
        role: 'Talent Acquisition Specialist — FPT Software',
        email: 'tuyendung@fpt.com',
        phone: '024 7300 7575'
      },
      companyOverview: {
        name: 'Công Ty TNHH Phần Mềm FPT (FPT Software Global)',
        scale: '30.000+ nhân viên tại 30 quốc gia',
        founded: '1999 (27 năm phát triển)',
        headquarters: 'F-Town, Khu Công Nghệ Cao, TP. Thủ Đức, TP.HCM',
        website: 'https://fptsoftware.com',
        description: 'FPT Software là công ty dịch vụ công nghệ thông tin và chuyển đổi số hàng đầu Đông Nam Á, cung cấp giải pháp cho hơn 1.000 khách hàng toàn cầu bao gồm các tập đoàn trong danh sách Fortune 500.'
      },
      description: [
        'Tham gia thiết kế và lập trình các dịch vụ Backend phục vụ dự án chuyển đổi số ngân hàng cho thị trường Nhật Bản và Bắc Mỹ.',
        'Xây dựng các RESTful API và gRPC service hiệu năng cao với Node.js và NestJS Framework.',
        'Thiết kế kiến trúc cơ sở dữ liệu quan hệ PostgreSQL chuẩn 3NF, viết truy vấn tối ưu và xử lý cơ chế Caching với Redis.',
        'Viết mã kiểm thử tự động (Unit Test, Integration Test) với Jest, duy trì mức độ bao phủ mã nguồn (Code Coverage) trên 80%.'
      ],
      requirements: [
        'Tốt nghiệp Đại học khối ngành CNTT, Khoa Học Máy Tính hoặc tương đương.',
        'Có ít nhất 1 năm kinh nghiệm phát triển hệ thống với Node.js / TypeScript.',
        'Hiểu biết sâu về nguyên lý lập trình hướng đối tượng (OOP), Clean Architecture và Design Patterns.',
        'Thành thạo viết truy vấn SQL trên PostgreSQL hoặc MySQL; có kiến thức về ORM như Prisma, TypeORM.',
        'Có kinh nghiệm cơ bản sử dụng Docker để đóng gói ứng dụng.',
        'Ưu tiên ứng viên có chứng chỉ tiếng Anh (TOEIC 650+ hoặc tương đương) hoặc tiếng Nhật (JLPT N3).'
      ],
      benefits: [
        { icon: '💰', title: 'Thu Nhập Cạnh Tranh', desc: '14 - 20 Triệu/tháng + Thưởng hoàn thành dự án + Thưởng hiệu suất năm.' },
        { icon: '✈️', title: 'Cơ Hội Onsite', desc: 'Cơ hội làm việc ngắn hạn và dài hạn tại Nhật Bản, Singapore, Hoa Kỳ.' },
        { icon: '🚌', title: 'Xe Đưa Đón Miễn Phí', desc: 'Hệ thống xe buýt đưa đón nhân viên từ trung tâm TP.HCM đến F-Town.' },
        { icon: '🏥', title: 'FPT Care', desc: 'Chế độ bảo hiểm sức khỏe toàn diện FPT Care dành cho nhân viên và người phụ thuộc.' },
        { icon: '⚽', title: 'Hoạt Động Thể Thao', desc: 'Sân bóng đá cỏ nhân tạo, sân tennis, bóng bàn nội bộ miễn phí.' },
        { icon: '🎓', title: 'Chứng Chỉ Quốc Tế', desc: 'Thưởng nóng lên đến $1.000 khi thi đỗ các chứng chỉ AWS / Azure / GCP.' }
      ]
    },

    'job-03': {
      id: 'job-03',
      title: 'Thực Tập Sinh Lập Trình Java / Spring Boot (Có Phụ Cấp)',
      company: 'Viettel Solutions (Tập Đoàn Viettel)',
      logo: 'VT',
      logoBg: 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)',
      verified: true,
      isHot: false,
      salary: '6 - 8 Triệu (Hỗ trợ)',
      salarySub: 'Phụ cấp thực tập + Cơm trưa + Cơ hội lên chính thức',
      location: 'Cầu Giấy, Hà Nội',
      locationDetail: 'Tòa nhà Viettel, Số 1 Giang Văn Minh, Ba Đình / Cầu Giấy, Hà Nội',
      workType: 'Thực tập sinh (Internship)',
      experience: 'Fresher / Dưới 1 năm kinh nghiệm',
      level: 'Software Intern',
      quantity: '10 Thực tập sinh',
      postedDate: '22/10/2026',
      deadline: '15/12/2026',
      views: 512,
      category: 'software',
      tags: ['Java', 'Spring Boot', 'MySQL', 'Git', 'Maven'],
      recruiter: {
        name: 'Đoàn Thanh Tùng',
        role: 'Trưởng ban Đào tạo & Tuyển dụng Trẻ — Viettel Solutions',
        email: 'talent@viettelsolutions.vn',
        phone: '024 6277 8888'
      },
      companyOverview: {
        name: 'Tổng Công Ty Giải Pháp Doanh Nghiệp Viettel (Viettel Solutions)',
        scale: '5.000+ kỹ sư công nghệ',
        founded: '2018 (Hạch toán từ Tập đoàn Viettel 1989)',
        headquarters: 'Tòa nhà Viettel, Cầu Giấy, Hà Nội',
        website: 'https://viettelsolutions.vn',
        description: 'Đơn vị thành viên của Tập đoàn Công nghiệp - Viễn thông Quân đội Viettel, dẫn dắt quá trình xây dựng Chính phủ điện tử và các giải pháp Smart City chuyển đổi số quốc gia.'
      },
      description: [
        'Tham gia chương trình đào tạo chuyên sâu "Viettel Digital Talent 2026" dành riêng cho sinh viên xuất sắc năm 3, năm 4 các trường đại học kỹ thuật.',
        'Trực tiếp tham gia phát triển các phân hệ phần mềm quản trị đô thị thông minh Smart City trên nền tảng Java Core và Spring Boot Framework.',
        'Được các chuyên gia giải pháp cấp cao (Principal Architect) kèm cặp 1-1 trong suốt thời gian 3 tháng thực tập.',
        'Học hỏi và thực hành quy trình phát triển phần mềm chuẩn quốc tế CMMI-5 và Agile Scrum.'
      ],
      requirements: [
        'Sinh viên năm 3, năm 4 hoặc mới tốt nghiệp chuyên ngành CNTT, ATTT, Viễn Thông tại các trường ĐH trên toàn quốc.',
        'Điểm trung bình tích lũy (GPA) từ 2.8/4.0 hoặc 7.0/10 trở lên.',
        'Nắm chắc kiến thức nền tảng về Cấu trúc dữ liệu và Giải thuật, Lập trình hướng đối tượng (OOP) với Java.',
        'Hiểu biết cơ bản về cơ sở dữ liệu quan hệ (SQL) và công cụ quản lý phiên bản Git.',
        'Có tư duy logic nhạy bén, ham học hỏi và sẵn sàng cam kết thực tập tối thiểu 3 ngày/tuần.'
      ],
      benefits: [
        { icon: '💵', title: 'Phụ Cấp Hàng Tháng', desc: 'Trợ cấp 6 - 8 triệu/tháng tương xứng với năng lực và số buổi tham gia.' },
        { icon: '👔', title: 'Lên Kỹ Sư Chính Thức', desc: 'Cơ hội ký hợp đồng lao động chính thức ngay sau khi kết thúc đợt thực tập.' },
        { icon: '👨‍🏫', title: 'Mentor 1-1', desc: 'Được các kỹ sư trưởng và kiến trúc sư hệ thống giàu kinh nghiệm hướng dẫn trực tiếp.' },
        { icon: '📜', title: 'Chứng Nhận Đồ Án', desc: 'Được đóng mộc xác nhận thực tập và hỗ trợ số liệu hoàn thành Khóa luận tốt nghiệp.' }
      ]
    },

    'job-04': {
      id: 'job-04',
      title: 'Chuyên Viên Phân Tích Dữ Liệu (Data Analyst)',
      company: 'MoMo (Ví Điện Tử MoMo)',
      logo: 'MM',
      logoBg: 'linear-gradient(135deg, #be185d 0%, #ec4899 100%)',
      verified: true,
      isHot: true,
      salary: '16 - 24 Triệu',
      salarySub: 'Thưởng hiệu quả kinh doanh & cổ phiếu ESOP',
      location: 'Quận 7, TP.HCM',
      locationDetail: 'Tòa nhà Phú Mỹ Hưng, Hoàng Văn Thái, Tân Phú, Quận 7, TP.HCM',
      workType: 'Toàn thời gian (Full-time)',
      experience: '1 - 3 năm kinh nghiệm',
      level: 'Middle Data Analyst',
      quantity: '02 Chuyên viên',
      postedDate: '21/10/2026',
      deadline: '20/11/2026',
      views: 610,
      category: 'data-ai',
      tags: ['SQL', 'Python', 'Power BI', 'Data Modeling', 'Tableau'],
      recruiter: {
        name: 'Lê Thùy Dương',
        role: 'Data & AI Talent Partner — MoMo Fintech',
        email: 'duong.le@mservice.com.vn',
        phone: '028 5414 7667'
      },
      companyOverview: {
        name: 'Công Ty Cổ Phần Dịch Vụ Di Động Trực Tuyến (M_Service - MoMo)',
        scale: '2.500+ nhân viên',
        founded: '2007 (19 năm phát triển)',
        headquarters: 'Quận 7, TP.HCM',
        website: 'https://momo.vn',
        description: 'MoMo là siêu ứng dụng tài chính hàng đầu Việt Nam, phục vụ hơn 31 triệu người dùng với mạng lưới thanh toán, tiết kiệm, đầu tư và giải trí số toàn diện.'
      },
      description: [
        'Thu thập, làm sạch và xử lý các tập dữ liệu lớn từ hệ thống thanh toán và hành vi người dùng trên siêu ứng dụng MoMo.',
        'Xây dựng và duy trì các Dashboard báo cáo quản trị tự động trên Power BI và Tableau phục vụ ban lãnh đạo và các khối kinh doanh.',
        'Thực hiện các phân tích chuyên sâu (Deep-dive Analytics), phân tích phễu chuyển đổi (Conversion Funnel) và thử nghiệm A/B Testing.',
        'Cộng tác với đội ngũ Data Engineering để định nghĩa cấu trúc dữ liệu Data Warehouse / Data Lake trên nền tảng BigQuery.'
      ],
      requirements: [
        'Tốt nghiệp Đại học chuyên ngành Hệ Thống Thông Tin, Khoa Học Dữ Liệu, Toán Tin, Thống Kê hoặc Kinh Tế.',
        'Thành thạo viết truy vấn SQL phức tạp (Window Functions, CTE, Query Optimization).',
        'Có kinh nghiệm sử dụng Python hoặc R để xử lý và phân tích dữ liệu (Pandas, NumPy, Matplotlib).',
        'Thành thạo ít nhất một công cụ BI (Power BI, Tableau, Looker) để trực quan hóa dữ liệu trực quan, rõ ràng.',
        'Tư duy phân tích số liệu sắc bén (Data-driven mindset) và kỹ năng thuyết trình giải pháp tốt.'
      ],
      benefits: [
        { icon: '💰', title: 'Thu Nhập Hấp Dẫn', desc: '16 - 24 Triệu/tháng + Gói thưởng hiệu quả kinh doanh cuối năm.' },
        { icon: '🏢', title: 'Văn Phòng Hiện Đại', desc: 'Không gian làm việc mở Agile, khu vực nghỉ ngơi Play Zone và Pantry tiện nghi.' },
        { icon: '📈', title: 'Cổ Phiếu ESOP', desc: 'Cơ hội nhận quyền mua cổ phiếu ưu đãi ESOP dành cho nhân sự đóng góp tốt.' },
        { icon: '⏰', title: 'Linh Hoạt Thời Gian', desc: 'Chính sách làm việc kết hợp linh hoạt Hybrid Working (1-2 ngày WFH/tuần).' }
      ]
    }
  };

  // --------------------------------------------------------------------------
  // 2. ĐỌC THAM SỐ URL & TẢI DỮ LIỆU CÔNG VIỆC (LOAD JOB BY ID)
  // --------------------------------------------------------------------------
  const params = new URLSearchParams(window.location.search);
  const currentJobId = params.get('id') || 'job-01';
  const job = JOBS_DB[currentJobId] || JOBS_DB['job-01'];

  // Cập nhật thẻ Title trang
  document.title = `${job.title} — ${job.company} | JobPortal UTH`;

  // --------------------------------------------------------------------------
  // 3. ĐIỀN DỮ LIỆU LÊN GIAO DIỆN (HYDRATE DOM ELEMENTS)
  // --------------------------------------------------------------------------
  function hydrateJobDetails() {
    // 3.1. Breadcrumbs
    const currentCrumb = document.getElementById('crumbJobTitle');
    if (currentCrumb) currentCrumb.textContent = job.title;

    // 3.2. Job Header Top
    const jobLogoBox = document.getElementById('jobLogoBox');
    if (jobLogoBox) {
      jobLogoBox.textContent = job.logo;
      jobLogoBox.style.background = job.logoBg;
    }

    const jobTitleEl = document.getElementById('jobTitle');
    if (jobTitleEl) jobTitleEl.textContent = job.title;

    const jobCompanyEl = document.getElementById('jobCompany');
    if (jobCompanyEl) {
      jobCompanyEl.innerHTML = `
        <span>🏢</span>
        <strong>${job.company}</strong>
        ${job.verified ? '<span class="badge badge-verified" title="Doanh nghiệp đã kiểm duyệt">✓ Xác thực</span>' : ''}
        ${job.isHot ? '<span class="badge badge-urgent">🔥 Tuyển Gấp</span>' : ''}
      `;
    }

    // Header Meta Pills
    const jobMetaPills = document.getElementById('jobMetaPills');
    if (jobMetaPills) {
      jobMetaPills.innerHTML = `
        <span class="meta-pill meta-pill-salary">💰 ${job.salary}</span>
        <span class="meta-pill">📍 ${job.location}</span>
        <span class="meta-pill">💼 ${job.experience}</span>
        <span class="meta-pill">⏰ ${job.workType}</span>
        <span class="meta-pill">👁️ ${job.views} lượt xem</span>
        <span class="meta-pill">🕒 Đăng ngày ${job.postedDate}</span>
      `;
    }

    // 3.3. Job Description List
    const jdList = document.getElementById('jdDescriptionList');
    if (jdList) {
      jdList.innerHTML = job.description.map(item => `
        <li class="jd-list-item">
          <span class="jd-list-item-bullet" aria-hidden="true">✓</span>
          <span>${item}</span>
        </li>
      `).join('');
    }

    // 3.4. Requirements List
    const reqList = document.getElementById('jdRequirementsList');
    if (reqList) {
      reqList.innerHTML = job.requirements.map(item => `
        <li class="jd-list-item">
          <span class="jd-list-item-bullet" aria-hidden="true">✓</span>
          <span>${item}</span>
        </li>
      `).join('');
    }

    // 3.5. Tech Tags
    const tagsContainer = document.getElementById('jdTagsContainer');
    if (tagsContainer) {
      tagsContainer.innerHTML = job.tags.map(tag => `
        <span class="badge badge-tech">${tag}</span>
      `).join('');
    }

    // 3.6. Benefits Grid
    const benefitsGrid = document.getElementById('jdBenefitsGrid');
    if (benefitsGrid) {
      benefitsGrid.innerHTML = job.benefits.map(b => `
        <div class="benefit-item">
          <div class="benefit-icon" aria-hidden="true">${b.icon}</div>
          <div>
            <div class="benefit-title">${b.title}</div>
            <div class="benefit-desc">${b.desc}</div>
          </div>
        </div>
      `).join('');
    }

    // 3.7. Company Overview Section
    const compName = document.getElementById('compName');
    if (compName) compName.textContent = job.companyOverview.name;

    const compDesc = document.getElementById('compDesc');
    if (compDesc) compDesc.textContent = job.companyOverview.description;

    const compScale = document.getElementById('compScale');
    if (compScale) compScale.textContent = job.companyOverview.scale;

    const compFounded = document.getElementById('compFounded');
    if (compFounded) compFounded.textContent = job.companyOverview.founded;

    const compHq = document.getElementById('compHq');
    if (compHq) compHq.textContent = job.companyOverview.headquarters;

    const compWebsite = document.getElementById('compWebsite');
    if (compWebsite) {
      compWebsite.href = job.companyOverview.website;
      compWebsite.textContent = job.companyOverview.website.replace('https://', '');
    }

    // 3.8. Sticky Action Box (Cột phải)
    const stickySalary = document.getElementById('stickySalary');
    if (stickySalary) stickySalary.textContent = job.salary;

    const stickyLocation = document.getElementById('stickyLocation');
    if (stickyLocation) stickyLocation.textContent = job.location;

    const stickyDeadline = document.getElementById('stickyDeadline');
    if (stickyDeadline) stickyDeadline.textContent = job.deadline;

    const stickyExp = document.getElementById('stickyExp');
    if (stickyExp) stickyExp.textContent = job.experience;

    const stickyQuantity = document.getElementById('stickyQuantity');
    if (stickyQuantity) stickyQuantity.textContent = job.quantity;

    const stickyLevel = document.getElementById('stickyLevel');
    if (stickyLevel) stickyLevel.textContent = job.level;

    const stickyWorkType = document.getElementById('stickyWorkType');
    if (stickyWorkType) stickyWorkType.textContent = job.workType;

    // Recruiter info
    const recName = document.getElementById('recruiterName');
    if (recName) recName.textContent = job.recruiter.name;

    const recRole = document.getElementById('recruiterRole');
    if (recRole) recRole.textContent = job.recruiter.role;

    const recEmail = document.getElementById('recruiterEmail');
    if (recEmail) recEmail.textContent = job.recruiter.email;

    // Mobile Bottom Bar
    const mobileBarSalary = document.getElementById('mobileBarSalary');
    if (mobileBarSalary) mobileBarSalary.textContent = job.salary;

    // Modal Details
    const modalJobTitle = document.getElementById('modalJobTitle');
    if (modalJobTitle) modalJobTitle.textContent = job.title;

    const modalJobCompany = document.getElementById('modalJobCompany');
    if (modalJobCompany) modalJobCompany.textContent = job.company;

    // Kiểm tra trạng thái đã ứng tuyển chưa
    checkApplicationStatus();
  }

  // --------------------------------------------------------------------------
  // 4. KIỂM TRA TRẠNG THÁI ỨNG TUYỂN (CHECK APPLIED STATE FROM LOCALSTORAGE)
  // --------------------------------------------------------------------------
  function checkApplicationStatus() {
    const appliedList = JSON.parse(localStorage.getItem('jobportal_applied_jobs') || '[]');
    const isApplied = appliedList.some(item => item.jobId === job.id);

    const applyBtns = document.querySelectorAll('.btn-trigger-apply');
    applyBtns.forEach(btn => {
      if (isApplied) {
        btn.classList.add('is-applied');
        btn.innerHTML = '<span>✓ ĐÃ NỘP HỒ SƠ ỨNG TUYỂN</span>';
        btn.disabled = true;
      } else {
        btn.classList.remove('is-applied');
        btn.innerHTML = '<span>⚡ ỨNG TUYỂN NGAY</span>';
        btn.disabled = false;
      }
    });
  }

  // --------------------------------------------------------------------------
  // 5. ĐIỀU KHIỂN CỬA SỔ MODAL NỘP HỒ SƠ (MODAL OPEN & CLOSE LOGIC)
  // --------------------------------------------------------------------------
  const applyModal = document.getElementById('applyModal');
  const btnCloseModal = document.getElementById('btnCloseModal');
  const btnCancelModal = document.getElementById('btnCancelModal');
  const applyBtns = document.querySelectorAll('.btn-trigger-apply');

  function openModal() {
    if (!applyModal) return;
    applyModal.classList.add('is-open');
    document.body.style.overflow = 'hidden';

    // Focus vào trường họ tên đầu tiên
    setTimeout(() => {
      const nameInput = document.getElementById('applicantName');
      if (nameInput) nameInput.focus();
    }, 100);
  }

  function closeModal() {
    if (!applyModal) return;
    applyModal.classList.remove('is-open');
    document.body.style.overflow = '';
  }

  applyBtns.forEach(btn => {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      const appliedList = JSON.parse(localStorage.getItem('jobportal_applied_jobs') || '[]');
      if (appliedList.some(item => item.jobId === job.id)) {
        if (window.showToast) {
          window.showToast('Bạn đã nộp hồ sơ cho vị trí này rồi! Kiểm tra mục Theo dõi đơn ứng tuyển.', 'info');
        }
        return;
      }
      openModal();
    });
  });

  if (btnCloseModal) btnCloseModal.addEventListener('click', closeModal);
  if (btnCancelModal) btnCancelModal.addEventListener('click', closeModal);

  if (applyModal) {
    applyModal.addEventListener('click', function (e) {
      if (e.target === applyModal) {
        closeModal();
      }
    });
  }

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && applyModal && applyModal.classList.contains('is-open')) {
      closeModal();
    }
  });

  // --------------------------------------------------------------------------
  // 6. XỬ LÝ KÉO & THẢ TỆP CV (DRAG AND DROP CV UPLOADER)
  // --------------------------------------------------------------------------
  const dropzone = document.getElementById('cvDropzone');
  const fileInput = document.getElementById('cvFileInput');
  const fileSelectedBadge = document.getElementById('fileSelectedBadge');
  const selectedFileName = document.getElementById('selectedFileName');
  const btnRemoveFile = document.getElementById('btnRemoveFile');
  let currentUploadedFile = null;

  if (dropzone && fileInput) {
    // Click vào dropzone để kích hoạt input file
    dropzone.addEventListener('click', () => {
      fileInput.click();
    });

    // Kéo thả chuột
    ['dragenter', 'dragover'].forEach(eventName => {
      dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.add('is-dragover');
      });
    });

    ['dragleave', 'drop'].forEach(eventName => {
      dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.remove('is-dragover');
      });
    });

    dropzone.addEventListener('drop', (e) => {
      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        handleFileSelection(files[0]);
      }
    });

    fileInput.addEventListener('change', function () {
      if (this.files && this.files.length > 0) {
        handleFileSelection(this.files[0]);
      }
    });
  }

  function handleFileSelection(file) {
    // Kiểm tra định dạng (.pdf, .doc, .docx)
    const validExts = ['.pdf', '.doc', '.docx'];
    const fileName = file.name.toLowerCase();
    const isValidExt = validExts.some(ext => fileName.endsWith(ext));

    if (!isValidExt) {
      if (window.showToast) {
        window.showToast('Vui lòng chỉ tải lên tệp hồ sơ định dạng PDF hoặc Word (.doc, .docx)!', 'warning');
      }
      return;
    }

    // Kiểm tra dung lượng (< 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      if (window.showToast) {
        window.showToast('Dung lượng tệp vượt quá giới hạn cho phép (Tối đa 5MB)!', 'danger');
      }
      return;
    }

    currentUploadedFile = file;
    const sizeInMb = (file.size / (1024 * 1024)).toFixed(2);

    if (selectedFileName && fileSelectedBadge && dropzone) {
      selectedFileName.textContent = `${file.name} (${sizeInMb} MB)`;
      fileSelectedBadge.style.display = 'flex';
      dropzone.style.display = 'none';
    }
  }

  if (btnRemoveFile) {
    btnRemoveFile.addEventListener('click', () => {
      currentUploadedFile = null;
      if (fileInput) fileInput.value = '';
      if (fileSelectedBadge) fileSelectedBadge.style.display = 'none';
      if (dropzone) dropzone.style.display = 'block';
    });
  }

  // --------------------------------------------------------------------------
  // 7. XỬ LÝ NỘP HỒ SƠ ỨNG TUYỂN (SUBMIT APPLICATION FORM)
  // --------------------------------------------------------------------------
  const applyForm = document.getElementById('applyJobForm');
  const btnSubmitApplication = document.getElementById('btnSubmitApplication');

  if (applyForm) {
    applyForm.addEventListener('submit', function (e) {
      e.preventDefault();

      const nameInput = document.getElementById('applicantName');
      const emailInput = document.getElementById('applicantEmail');
      const phoneInput = document.getElementById('applicantPhone');
      const coverLetterInput = document.getElementById('applicantCoverLetter');

      const name = nameInput ? nameInput.value.trim() : '';
      const email = emailInput ? emailInput.value.trim() : '';
      const phone = phoneInput ? phoneInput.value.trim() : '';
      const coverLetter = coverLetterInput ? coverLetterInput.value.trim() : '';

      // Kiểm tra hợp lệ các trường
      if (!name || !email || !phone) {
        if (window.showToast) {
          window.showToast('Vui lòng điền đầy đủ Họ và tên, Email và Số điện thoại liên hệ!', 'warning');
        }
        return;
      }

      // Kiểm tra đã đính kèm CV chưa
      if (!currentUploadedFile) {
        if (window.showToast) {
          window.showToast('Vui lòng tải lên tệp CV của bạn trước khi nộp đơn!', 'warning');
        }
        return;
      }

      // Hiệu ứng gửi hồ sơ (Loading simulation)
      if (btnSubmitApplication) {
        btnSubmitApplication.disabled = true;
        btnSubmitApplication.innerHTML = '<span>Đang gửi hồ sơ... ⏳</span>';
      }

      setTimeout(() => {
        // Lưu đơn ứng tuyển vào localStorage để hiển thị trên candidate-dashboard / my-applications
        const appliedList = JSON.parse(localStorage.getItem('jobportal_applied_jobs') || '[]');
        const newApplication = {
          id: 'app-' + Date.now(),
          jobId: job.id,
          jobTitle: job.title,
          company: job.company,
          salary: job.salary,
          location: job.location,
          applicantName: name,
          applicantEmail: email,
          applicantPhone: phone,
          fileName: currentUploadedFile.name,
          fileSize: (currentUploadedFile.size / (1024 * 1024)).toFixed(2) + ' MB',
          coverLetter: coverLetter,
          appliedAt: new Date().toLocaleString('vi-VN'),
          status: 'submitted', // submitted -> reviewing -> interview -> offer
          statusText: 'Đã nộp đơn'
        };

        appliedList.unshift(newApplication);
        localStorage.setItem('jobportal_applied_jobs', JSON.stringify(appliedList));

        // Khôi phục nút
        if (btnSubmitApplication) {
          btnSubmitApplication.disabled = false;
          btnSubmitApplication.innerHTML = '<span>Xác Nhận Nộp Đơn ↗</span>';
        }

        // Đóng modal
        closeModal();

        // Hiển thị thông báo thành công
        if (window.showToast) {
          window.showToast(`Nộp hồ sơ thành công cho vị trí "${job.title}"! Nhà tuyển dụng sẽ phản hồi trong 24-48h.`, 'success');
        }

        // Cập nhật lại trạng thái nút trên giao diện
        checkApplicationStatus();
      }, 1000);
    });
  }

  // --------------------------------------------------------------------------
  // 8. TÍNH NĂNG LƯU TIN (BOOKMARK JOB)
  // --------------------------------------------------------------------------
  const btnBookmark = document.getElementById('btnBookmarkJob');
  let bookmarks = JSON.parse(localStorage.getItem('jobportal_bookmarks') || '[]');

  function updateBookmarkUI() {
    if (!btnBookmark) return;
    const isBookmarked = bookmarks.includes(job.id);
    if (isBookmarked) {
      btnBookmark.innerHTML = '<span>❤️</span><span>Đã Lưu Tin</span>';
      btnBookmark.style.borderColor = 'var(--color-danger)';
      btnBookmark.style.color = 'var(--color-danger)';
    } else {
      btnBookmark.innerHTML = '<span>🤍</span><span>Lưu Tin Tuyển Dụng</span>';
      btnBookmark.style.borderColor = '';
      btnBookmark.style.color = '';
    }
  }

  if (btnBookmark) {
    updateBookmarkUI();
    btnBookmark.addEventListener('click', function () {
      const idx = bookmarks.indexOf(job.id);
      if (idx > -1) {
        bookmarks.splice(idx, 1);
        if (window.showToast) {
          window.showToast(`Đã bỏ lưu tin "${job.title}"`, 'info');
        }
      } else {
        bookmarks.push(job.id);
        if (window.showToast) {
          window.showToast(`Đã lưu tin "${job.title}" vào danh sách quan tâm!`, 'success');
        }
      }
      localStorage.setItem('jobportal_bookmarks', JSON.stringify(bookmarks));
      updateBookmarkUI();
    });
  }

  // --------------------------------------------------------------------------
  // 9. TÍNH NĂNG CHIA SẺ TIN (SHARE JOB LINK)
  // --------------------------------------------------------------------------
  const btnShare = document.getElementById('btnShareJob');
  if (btnShare) {
    btnShare.addEventListener('click', function () {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(window.location.href).then(() => {
          if (window.showToast) {
            window.showToast('Đã sao chép liên kết tuyển dụng vào bộ nhớ tạm (Clipboard)!', 'success');
          }
        }).catch(() => {
          fallbackCopyText(window.location.href);
        });
      } else {
        fallbackCopyText(window.location.href);
      }
    });
  }

  function fallbackCopyText(text) {
    const dummy = document.createElement('input');
    document.body.appendChild(dummy);
    dummy.value = text;
    dummy.select();
    document.execCommand('copy');
    document.body.removeChild(dummy);
    if (window.showToast) {
      window.showToast('Đã sao chép liên kết tuyển dụng vào clipboard!', 'success');
    }
  }

  // --------------------------------------------------------------------------
  // 10. GỢI Ý CÁC VIỆC LÀM TƯƠNG TỰ (SIMILAR JOBS RECOMMENDATION)
  // --------------------------------------------------------------------------
  const similarContainer = document.getElementById('similarJobsContainer');
  if (similarContainer) {
    const allKeys = Object.keys(JOBS_DB);
    const otherKeys = allKeys.filter(k => k !== job.id);

    // Lấy 3 việc làm khác
    const similarKeys = otherKeys.slice(0, 3);
    similarContainer.innerHTML = similarKeys.map(k => {
      const sJob = JOBS_DB[k];
      return `
        <article class="job-listing-item" style="padding: 16px 20px;">
          <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; margin-bottom: 6px;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <div class="company-logo-box" style="width: 40px; height: 40px; font-size: 0.95rem; background: ${sJob.logoBg}; color: #ffffff;">
                ${sJob.logo}
              </div>
              <div>
                <h4 style="font-size: 1.05rem; font-weight: 700; margin: 0 0 2px;">
                  <a href="./job-detail.html?id=${sJob.id}" style="color: var(--color-dark);">${sJob.title}</a>
                </h4>
                <div style="font-size: var(--text-xs); color: var(--color-muted);">🏢 ${sJob.company}</div>
              </div>
            </div>
            <span class="job-item-salary" style="font-size: 0.9rem; padding: 3px 8px;">💰 ${sJob.salary}</span>
          </div>
          <div style="display: flex; align-items: center; justify-content: space-between; font-size: var(--text-xs); color: var(--color-muted); border-top: 1px solid var(--color-border-light); padding-top: 8px; margin-top: 6px;">
            <span>📍 ${sJob.location} • 🕒 Hạn nộp: ${sJob.deadline}</span>
            <a href="./job-detail.html?id=${sJob.id}" style="color: var(--color-primary); font-weight: 700;">Xem chi tiết →</a>
          </div>
        </article>
      `;
    }).join('');
  }

  // --------------------------------------------------------------------------
  // 11. KHỞI TẠO NỘI DUNG (RUN HYDRATION)
  // --------------------------------------------------------------------------
  hydrateJobDetails();
});
