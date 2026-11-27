/**
 * ============================================================================
 * BỔ SUNG DỮ LIỆU ĐA NGÀNH NGHỀ CHUẨN THỊ TRƯỜNG VIỆT NAM (IDEMPOTENT SEEDER)
 * Phủ đủ 16 nhóm ngành nghề & cập nhật logo ảnh thật cho 16 doanh nghiệp.
 * Chạy thủ công: npm run seed-industries
 * Tự động chạy an toàn khi Server khởi động (không ghi đè dữ liệu người dùng).
 * ============================================================================
 */

const mysql = require('mysql2/promise');
const { buildDbConfig } = require('../config/db');

const DEMO_PASSWORD_HASH = '$2a$10$5hF8xnvdokAe1hzYSAdUeuM6GJZs8bJKSqqmvFvUiSiWRysgg19Ai'; // 123456

const COMPANY_LOGOS = {
  'vng-corporation': './assets/images/logos/vng-corporation.png',
  'fpt-software': './assets/images/logos/fpt-software.png',
  'viettel-solutions': './assets/images/logos/viettel-solutions.png',
  'momo-fintech': './assets/images/logos/momo-fintech.png',
  'shopee-vietnam': './assets/images/logos/shopee-vietnam.png',
  'kms-technology': './assets/images/logos/kms-technology.png',
  'adsplus-digital': './assets/images/logos/adsplus-digital.png',
  'misa-jsc': './assets/images/logos/misa-jsc.png',
  'techcombank': './assets/images/logos/techcombank.png',
  'navigos-group': './assets/images/logos/navigos-group.png',
  'gemadept-logistics': './assets/images/logos/gemadept-logistics.png',
  'fpt-retail': './assets/images/logos/fpt-retail.png',
  'coteccons': './assets/images/logos/coteccons.png',
  'long-chau-pharma': './assets/images/logos/long-chau-pharma.png',
  'vus-education': './assets/images/logos/vus-education.png',
  'bosch-vietnam': './assets/images/logos/bosch-vietnam.png'
};

const NEW_CATEGORIES = [
  {
    name: 'Marketing & Truyền Thông',
    slug: 'marketing-truyen-thong',
    description: 'Chiến dịch Digital Ads (Facebook, Google, TikTok), SEO/SEM, Content Marketing và phát triển thương hiệu.'
  },
  {
    name: 'Tài Chính – Kế Toán – Kiểm Toán',
    slug: 'tai-chinh-ke-toan',
    description: 'Kế toán tổng hợp, kê khai thuế, lập báo cáo tài chính chuẩn VAS, kiểm toán nội bộ và phân tích tài chính.'
  },
  {
    name: 'Kinh Doanh & Phát Triển Thị Trường (Sales)',
    slug: 'kinh-doanh-ban-hang',
    description: 'Tư vấn giải pháp B2B/SaaS, chăm sóc khách hàng doanh nghiệp, đàm phán hợp đồng và phát triển doanh thu.'
  },
  {
    name: 'Nhân Sự & Hành Chính (HR / C&B)',
    slug: 'nhan-su-hanh-chinh',
    description: 'Tuyển dụng nhân sự, quản trị tiền lương & phúc lợi (C&B), quan hệ lao động và đào tạo nội bộ.'
  },
  {
    name: 'Logistics & Xuất Nhập Khẩu',
    slug: 'logistics-chuoi-cung-ung',
    description: 'Điều phối vận tải quốc tế, khai báo hải quan VNACCS, chứng từ xuất nhập khẩu (Incoterms) và chuỗi cung ứng.'
  },
  {
    name: 'Thương Mại Điện Tử & Vận Hành Sàn',
    slug: 'thuong-mai-dien-tu',
    description: 'Quản lý gian hàng Shopee/Lazada/TikTok Shop, tối ưu chuyển đổi chiến dịch Mega Sale và đối soát vận hành.'
  },
  {
    name: 'Xây Dựng – Kiến Trúc & Bất Động Sản',
    slug: 'xay-dung-kien-truc',
    description: 'Giám sát thi công, kỹ sư kết cấu, dự toán QS, quản lý dự án công trình dân dụng và công nghiệp.'
  },
  {
    name: 'Y Tế – Dược Phẩm & Chăm Sóc Sức Khỏe',
    slug: 'y-te-duoc-pham',
    description: 'Dược sĩ tư vấn, trình dược viên, quản lý chất lượng dược phẩm GPP và dịch vụ chăm sóc sức khỏe.'
  },
  {
    name: 'Giáo Dục – Đào Tạo & Ngoại Ngữ',
    slug: 'giao-duc-dao-tao',
    description: 'Giảng dạy ngoại ngữ, tư vấn tuyển sinh, quản lý học vụ và thiết kế chương trình đào tạo doanh nghiệp.'
  },
  {
    name: 'Sản Xuất – Cơ Khí & Tự Động Hóa',
    slug: 'co-khi-san-xuat',
    description: 'Kỹ sư tự động hóa PLC, cơ khí chế tạo, vận hành dây chuyền nhà máy thông minh và quản lý chất lượng QA.'
  }
];

const NEW_LOCATIONS = [
  { name: 'Hải Phòng', slug: 'hai-phong' },
  { name: 'Bình Dương', slug: 'binh-duong' }
];

const NEW_SKILLS = [
  { name: 'Digital Marketing', slug: 'digital-marketing' },
  { name: 'Google Ads', slug: 'google-ads' },
  { name: 'Facebook Ads', slug: 'facebook-ads' },
  { name: 'SEO / Content', slug: 'seo-content' },
  { name: 'Kế Toán Tổng Hợp', slug: 'ke-toan-tong-hop' },
  { name: 'Phần Mềm MISA', slug: 'phan-mem-misa' },
  { name: 'Báo Cáo Thuế VAS', slug: 'bao-cao-thue-vas' },
  { name: 'Phân Tích Tài Chính', slug: 'phan-tich-tai-chinh' },
  { name: 'Excel Nâng Cao', slug: 'excel-nang-cao' },
  { name: 'Sales B2B', slug: 'sales-b2b' },
  { name: 'Đàm Phán Hợp Đồng', slug: 'dam-phan-hop-dong' },
  { name: 'CRM HubSpot', slug: 'crm-hubspot' },
  { name: 'Tuyển Dụng HR', slug: 'tuyen-dung-hr' },
  { name: 'C&B / Bảo Hiểm', slug: 'cb-bao-hiem' },
  { name: 'Luật Lao Động', slug: 'luat-lao-dong' },
  { name: 'Xuất Nhập Khẩu', slug: 'xuat-nhap-khau' },
  { name: 'Khai Báo Hải Quan', slug: 'khai-bao-hai-quan' },
  { name: 'Incoterms', slug: 'incoterms' },
  { name: 'Supply Chain', slug: 'supply-chain' },
  { name: 'Vận Hành Sàn TMĐT', slug: 'van-hanh-san-tmdt' },
  { name: 'Shopee / TikTok Shop', slug: 'shopee-tiktok-shop' },
  { name: 'Power BI', slug: 'power-bi' },
  { name: 'Selenium / Postman', slug: 'selenium-postman' },
  { name: 'AutoCAD / Revit BIM', slug: 'autocad-revit-bim' },
  { name: 'Giám Sát Thi Công', slug: 'giam-sat-thi-cong' },
  { name: 'Dược Lâm Sàng GPP', slug: 'duoc-lam-sang-gpp' },
  { name: 'Tư Vấn Tuyển Sinh', slug: 'tu-van-tuyen-sinh' },
  { name: 'Tự Động Hóa PLC', slug: 'tu-dong-hoa-plc' },
  { name: 'SIEM / Bảo Mật Mạng', slug: 'siem-bao-mat-mang' }
];

const NEW_EMPLOYERS = [
  {
    full_name: 'Phạm Minh Tuấn (AdsPlus HR)',
    email: 'hr@adsplus.vn',
    phone: '0908111222',
    company_name: 'Công Ty Cổ Phần Quảng Cáo Số AdsPlus',
    slug: 'adsplus-digital',
    tax_code: '0313456789',
    website: 'https://adsplus.vn',
    address: '274 Võ Văn Tần, Quận 3, TP.HCM',
    description: 'Đối tác cấp cao của Google & Meta tại Việt Nam, chuyên triển khai Performance Marketing và giải pháp tăng trưởng doanh thu số.'
  },
  {
    full_name: 'Nguyễn Thu Hà (MISA Talent)',
    email: 'careers@misa.com.vn',
    phone: '0908222333',
    company_name: 'Công Ty Cổ Phần MISA',
    slug: 'misa-jsc',
    tax_code: '0101243150',
    website: 'https://www.misa.vn',
    address: 'Tòa nhà Technosoft, Duy Tân, Cầu Giấy, Hà Nội',
    description: 'Doanh nghiệp công nghệ hàng đầu Việt Nam về phần mềm kế toán, quản trị tài chính và nền tảng chuyển đổi số doanh nghiệp SME.'
  },
  {
    full_name: 'Lê Hoàng Nam (Techcombank HR)',
    email: 'hr@techcombank-careers.vn',
    phone: '0908333444',
    company_name: 'Ngân Hàng TMCP Kỹ Thương Việt Nam (Techcombank)',
    slug: 'techcombank',
    tax_code: '0100230800',
    website: 'https://techcombank.com',
    address: '23 Lê Duẩn, Quận 1, TP.HCM',
    description: 'Ngân hàng thương mại cổ phần hàng đầu Việt Nam tiên phong trong tài chính số, phân tích dữ liệu và quản trị rủi ro hiện đại.'
  },
  {
    full_name: 'Trần Ngọc Linh (Navigos HR)',
    email: 'careers@navigosgroup.com',
    phone: '0908444555',
    company_name: 'Tập Đoàn Nguồn Nhân Lực Navigos Group',
    slug: 'navigos-group',
    tax_code: '0302551756',
    website: 'https://www.navigosgroup.com',
    address: 'Tòa nhà e.town Central, 11 Đoàn Văn Bơ, Quận 4, TP.HCM',
    description: 'Tập đoàn dẫn đầu trong lĩnh vực dịch vụ tuyển dụng, tư vấn nhân sự cấp cao và giải pháp quản trị nhân tài tại Việt Nam.'
  },
  {
    full_name: 'Đặng Quốc Việt (Gemadept HR)',
    email: 'talent@gemadept.com.vn',
    phone: '0908555666',
    company_name: 'Công Ty Cổ Phần Gemadept Logistics',
    slug: 'gemadept-logistics',
    tax_code: '0301116791',
    website: 'https://www.gemadept.com.vn',
    address: '6 Lê Thánh Tôn, Quận 1, TP.HCM',
    description: 'Doanh nghiệp tiên phong trong khai thác cảng biển, vận tải đa phương thức và quản trị chuỗi cung ứng tích hợp hàng đầu Việt Nam.'
  },
  {
    full_name: 'Vũ Thị Mai Phương (FPT Retail HR)',
    email: 'hr@fptretail.com.vn',
    phone: '0908666777',
    company_name: 'Công Ty Cổ Phần Bán Lẻ Kỹ Thuật Số FPT Retail',
    slug: 'fpt-retail',
    tax_code: '0311609355',
    website: 'https://frt.vn',
    address: '261 Khánh Hội, Quận 4, TP.HCM',
    description: 'Hệ thống bán lẻ đa kênh hàng đầu Việt Nam vận hành chuỗi FPT Shop và hệ sinh thái thương mại điện tử.'
  },
  {
    full_name: 'Hoàng Minh Đức (Coteccons HR)',
    email: 'hr@coteccons-careers.vn',
    phone: '0908777888',
    company_name: 'Công Ty Cổ Phần Xây Dựng Coteccons',
    slug: 'coteccons',
    tax_code: '0303443233',
    website: 'https://www.coteccons.vn',
    address: '236/6 Điện Biên Phủ, Bình Thạnh, TP.HCM',
    description: 'Tổng thầu xây dựng hàng đầu Việt Nam triển khai các dự án cao ốc thương mại, khu đô thị và nhà máy công nghiệp tiêu chuẩn xanh.'
  },
  {
    full_name: 'Nguyễn Ngọc Ánh (Long Châu HR)',
    email: 'talent@nhathuoclongchau.com.vn',
    phone: '0908888999',
    company_name: 'Hệ Thống Nhà Thuốc FPT Long Châu',
    slug: 'long-chau-pharma',
    tax_code: '0315275368',
    website: 'https://nhathuoclongchau.com.vn',
    address: '379-381 Hai Bà Trưng, Quận 3, TP.HCM',
    description: 'Chuỗi nhà thuốc chuẩn GPP hàng đầu trên toàn quốc cung cấp dược phẩm chính hãng và dịch vụ tư vấn dược lâm sàng chuyên nghiệp.'
  },
  {
    full_name: 'Lý Bảo Trâm (VUS Talent)',
    email: 'careers@vus.edu.vn',
    phone: '0908999000',
    company_name: 'Hệ Thống Anh Văn Hội Việt Mỹ (VUS)',
    slug: 'vus-education',
    tax_code: '0303476442',
    website: 'https://vus.edu.vn',
    address: '189 Nguyễn Thị Minh Khai, Quận 1, TP.HCM',
    description: 'Hệ thống giáo dục và đào tạo Anh ngữ chuẩn quốc tế NEAS với mạng lưới trung tâm lớn tại TP.HCM, Hà Nội và các tỉnh thành.'
  },
  {
    full_name: 'Trần Hữu Nghĩa (Bosch HR)',
    email: 'hr@bosch-vietnam-careers.vn',
    phone: '0909111333',
    company_name: 'Công Ty TNHH Bosch Việt Nam',
    slug: 'bosch-vietnam',
    tax_code: '3600891439',
    website: 'https://www.bosch.com.vn',
    address: 'KCN Long Thành / Bình Dương & Tòa nhà Etown, TP.HCM',
    description: 'Tập đoàn công nghệ và kỹ thuật đa quốc gia của Đức hoạt động mạnh trong tự động hóa công nghiệp, R&D và sản xuất thông minh.'
  }
];

const NEW_JOBS = [
  {
    company_slug: 'momo-fintech',
    category_slug: 'khoa-hoc-du-lieu-ai',
    location_slug: 'tp-ho-chi-minh',
    title: 'Chuyên Viên Phân Tích Dữ Liệu (Data Analyst)',
    slug: 'data-analyst-momo-07',
    description: 'Phân tích hành vi người dùng ví điện tử, xây dựng Dashboard theo dõi chỉ số tăng trưởng và đề xuất tối ưu phễu chuyển đổi cho đội ngũ sản phẩm.',
    requirements: 'Thành thạo SQL truy vấn dữ liệu lớn, Python hoặc Power BI. Tư duy thống kê tốt, có kinh nghiệm 1-2 năm ở mảng Fintech/E-commerce là lợi thế.',
    benefits: 'Lương cạnh tranh 16-24 triệu + thưởng hiệu suất, bảo hiểm sức khỏe toàn diện và lộ trình phát triển Data Scientist.',
    salary_min: 16000000,
    salary_max: 24000000,
    currency: 'VND',
    employment_type: 'full_time',
    experience_level: 'middle',
    deadline_days: 45,
    skills: ['SQL', 'Python', 'Power BI']
  },
  {
    company_slug: 'kms-technology',
    category_slug: 'kiem-thu-phan-mem-qa',
    location_slug: 'da-nang',
    title: 'Kỹ Sư Kiểm Thử Phần Mềm (QA / Automation Tester)',
    slug: 'qa-automation-tester-kms-08',
    description: 'Xây dựng Test Plan, viết kịch bản kiểm thử API/UI tự động bằng Selenium & Postman, phối hợp trực tiếp với đội phát triển sản phẩm theo mô hình Agile.',
    requirements: 'Nắm vững quy trình kiểm thử phần mềm, thành thạo Postman, SQL cơ bản và có kinh nghiệm viết script Automation với Selenium hoặc Playwright.',
    benefits: 'Môi trường tiếng Anh chuyên nghiệp tại Đà Nẵng, phụ cấp ăn trưa, 15 ngày phép năm và gói bảo hiểm cao cấp.',
    salary_min: 13000000,
    salary_max: 22000000,
    currency: 'VND',
    employment_type: 'full_time',
    experience_level: 'junior',
    deadline_days: 45,
    skills: ['Selenium / Postman', 'SQL', 'Git']
  },
  {
    company_slug: 'adsplus-digital',
    category_slug: 'marketing-truyen-thong',
    location_slug: 'tp-ho-chi-minh',
    title: 'Chuyên Viên Digital Marketing (Performance Ads)',
    slug: 'digital-marketing-performance-adsplus-09',
    description: 'Lập kế hoạch, trực tiếp cài đặt và tối ưu chiến dịch quảng cáo trên Google Ads, Facebook Ads và TikTok Ads; theo dõi chỉ số CPC, CPA, ROAS và tối ưu ngân sách khách hàng.',
    requirements: 'Có 1-2 năm kinh nghiệm thực chiến Performance Ads, tư duy phân tích số liệu tốt, hiểu về SEO/Content và thành thạo Google Analytics.',
    benefits: 'Lương cứng 12-20 triệu + thưởng KPI chiến dịch không giới hạn, đào tạo chứng chỉ chính hãng Google & Meta Blueprint.',
    salary_min: 12000000,
    salary_max: 20000000,
    currency: 'VND',
    employment_type: 'full_time',
    experience_level: 'junior',
    deadline_days: 40,
    skills: ['Digital Marketing', 'Google Ads', 'Facebook Ads']
  },
  {
    company_slug: 'adsplus-digital',
    category_slug: 'marketing-truyen-thong',
    location_slug: 'tp-ho-chi-minh',
    title: 'Thực Tập Sinh Marketing & Content Creator',
    slug: 'thuc-tap-sinh-marketing-adsplus-10',
    description: 'Tham gia lên ý tưởng nội dung mạng xã hội, viết bài chuẩn SEO, hỗ trợ sản xuất video ngắn và theo dõi chỉ số tương tác chiến dịch dưới sự hướng dẫn của Mentor.',
    requirements: 'Sinh viên năm cuối hoặc mới tốt nghiệp ngành Marketing, Truyền thông, Thương mại điện tử. Khả năng viết lách tốt, biết cơ bản Canva hoặc CapCut.',
    benefits: 'Phụ cấp thực tập 4-6 triệu/tháng + hỗ trợ xác nhận báo cáo thực tập, cơ hội trở thành nhân viên chính thức sau 3 tháng.',
    salary_min: 4000000,
    salary_max: 6000000,
    currency: 'VND',
    employment_type: 'internship',
    experience_level: 'intern',
    deadline_days: 50,
    skills: ['SEO / Content', 'Digital Marketing']
  },
  {
    company_slug: 'misa-jsc',
    category_slug: 'tai-chinh-ke-toan',
    location_slug: 'ha-noi',
    title: 'Nhân Viên Kế Toán Tổng Hợp (Thuế & Báo Cáo VAS)',
    slug: 'ke-toan-tong-hop-misa-11',
    description: 'Kiểm tra tính hợp lệ chứng từ thu chi, hạch toán nghiệp vụ phát sinh trên phần mềm MISA, lập tờ khai thuế định kỳ và phối hợp lập báo cáo tài chính theo chuẩn mực kế toán Việt Nam.',
    requirements: 'Tốt nghiệp Đại học chuyên ngành Kế toán/Kiểm toán, 1-3 năm kinh nghiệm kế toán tổng hợp, nắm vững Luật Thuế hiện hành và thành thạo MISA, Excel.',
    benefits: 'Thu nhập 11-16 triệu + lương tháng 13, chế độ BHXH đầy đủ và môi trường làm việc chuẩn mực tại Hà Nội.',
    salary_min: 11000000,
    salary_max: 16000000,
    currency: 'VND',
    employment_type: 'full_time',
    experience_level: 'junior',
    deadline_days: 45,
    skills: ['Kế Toán Tổng Hợp', 'Phần Mềm MISA', 'Báo Cáo Thuế VAS']
  },
  {
    company_slug: 'techcombank',
    category_slug: 'tai-chinh-ke-toan',
    location_slug: 'tp-ho-chi-minh',
    title: 'Chuyên Viên Phân Tích Tài Chính Doanh Nghiệp',
    slug: 'phan-tich-tai-chinh-techcombank-12',
    description: 'Thẩm định hiệu quả tài chính dự án, lập mô hình dự báo dòng tiền, phân tích báo cáo quản trị P&L và đề xuất giải pháp tối ưu nguồn vốn cho khối khách hàng doanh nghiệp.',
    requirements: 'Tốt nghiệp Tài chính - Ngân hàng hoặc Kinh tế, 2 năm kinh nghiệm phân tích tài chính/kiểm toán, thành thạo Excel Financial Modeling và Power BI.',
    benefits: 'Thu nhập hấp dẫn 18-28 triệu + thưởng thành tích năm, gói vay ưu đãi nhân viên và bảo hiểm Techcombank Care.',
    salary_min: 18000000,
    salary_max: 28000000,
    currency: 'VND',
    employment_type: 'full_time',
    experience_level: 'middle',
    deadline_days: 45,
    skills: ['Phân Tích Tài Chính', 'Excel Nâng Cao', 'Power BI']
  },
  {
    company_slug: 'misa-jsc',
    category_slug: 'tai-chinh-ke-toan',
    location_slug: 'tp-ho-chi-minh',
    title: 'Thực Tập Sinh Kế Toán – Tư Vấn Nghiệp Vụ',
    slug: 'thuc-tap-sinh-ke-toan-misa-13',
    description: 'Hỗ trợ sắp xếp hóa đơn chứng từ, thực hành nhập liệu sổ sách trên phần mềm kế toán MISA và hỗ trợ giải đáp nghiệp vụ cơ bản cho khách hàng doanh nghiệp.',
    requirements: 'Sinh viên năm 3, năm 4 chuyên ngành Kế toán, Tài chính; cẩn thận, trung thực và giao tiếp tốt.',
    benefits: 'Trợ cấp 4-6 triệu/tháng, cấp dấu thực tập và cơ hội tuyển thẳng vào đội ngũ chuyên viên tư vấn chính thức.',
    salary_min: 4000000,
    salary_max: 6000000,
    currency: 'VND',
    employment_type: 'internship',
    experience_level: 'intern',
    deadline_days: 55,
    skills: ['Phần Mềm MISA', 'Excel Nâng Cao']
  },
  {
    company_slug: 'misa-jsc',
    category_slug: 'kinh-doanh-ban-hang',
    location_slug: 'tp-ho-chi-minh',
    title: 'Chuyên Viên Kinh Doanh Giải Pháp Doanh Nghiệp (Sales B2B)',
    slug: 'sales-b2b-giai-phap-misa-14',
    description: 'Tìm kiếm và phát triển tệp khách hàng doanh nghiệp SME, trình bày giải pháp phần mềm quản trị, đàm phán báo giá và ký kết hợp đồng đạt mục tiêu doanh số.',
    requirements: 'Đam mê kinh doanh B2B, kỹ năng giao tiếp và đàm phán thuyết phục; ưu tiên ứng viên từng dùng CRM hoặc có kinh nghiệm Sales từ 6 tháng.',
    benefits: 'Lương cứng 10-15 triệu + hoa hồng hấp dẫn (tổng thu nhập 15-30 triệu), lộ trình thăng tiến Trưởng nhóm kinh doanh rõ ràng.',
    salary_min: 15000000,
    salary_max: 30000000,
    currency: 'VND',
    employment_type: 'full_time',
    experience_level: 'junior',
    deadline_days: 45,
    skills: ['Sales B2B', 'Đàm Phán Hợp Đồng', 'CRM HubSpot']
  },
  {
    company_slug: 'navigos-group',
    category_slug: 'nhan-su-hanh-chinh',
    location_slug: 'tp-ho-chi-minh',
    title: 'Chuyên Viên Nhân Sự Tổng Hợp & C&B (HR Generalist)',
    slug: 'hr-generalist-cb-navigos-15',
    description: 'Phụ trách quy trình tuyển dụng nhân sự khối văn phòng, quản lý chấm công – tính lương, thực hiện thủ tục BHXH/thuế TNCN và xây dựng chính sách phúc lợi gắn kết nhân viên.',
    requirements: 'Tốt nghiệp Quản trị Nhân lực/Luật, từ 1-3 năm kinh nghiệm vị trí HR/C&B, am hiểu Bộ luật Lao động và thành thạo Excel.',
    benefits: 'Lương 13-20 triệu/tháng, làm việc linh hoạt hybrid, phụ cấp sức khỏe và cơ hội tham gia các hội thảo nhân sự lớn.',
    salary_min: 13000000,
    salary_max: 20000000,
    currency: 'VND',
    employment_type: 'full_time',
    experience_level: 'junior',
    deadline_days: 40,
    skills: ['Tuyển Dụng HR', 'C&B / Bảo Hiểm', 'Luật Lao Động']
  },
  {
    company_slug: 'gemadept-logistics',
    category_slug: 'logistics-chuoi-cung-ung',
    location_slug: 'tp-ho-chi-minh',
    title: 'Chuyên Viên Điều Phối Logistics & Xuất Nhập Khẩu',
    slug: 'dieu-phoi-logistics-xnk-gemadept-16',
    description: 'Xử lý bộ chứng từ xuất nhập khẩu (B/L, Invoice, Packing List, C/O), thực hiện khai báo hải quan điện tử VNACCS và điều phối lịch tàu/xe container giao nhận đúng hạn.',
    requirements: 'Tốt nghiệp ngành Logistics, Kinh tế quốc tế; nắm vững Incoterms, quy trình hải quan và giao tiếp tiếng Anh tốt để làm việc với hãng tàu nước ngoài.',
    benefits: 'Lương 14-22 triệu + thưởng quý, phụ cấp ăn trưa/điện thoại và chế độ nghỉ dưỡng hàng năm.',
    salary_min: 14000000,
    salary_max: 22000000,
    currency: 'VND',
    employment_type: 'full_time',
    experience_level: 'junior',
    deadline_days: 45,
    skills: ['Xuất Nhập Khẩu', 'Khai Báo Hải Quan', 'Incoterms']
  },
  {
    company_slug: 'gemadept-logistics',
    category_slug: 'logistics-chuoi-cung-ung',
    location_slug: 'hai-phong',
    title: 'Kỹ Sư Chuỗi Cung Ứng & Vận Hành Cảng (Supply Chain)',
    slug: 'supply-chain-engineer-gemadept-17',
    description: 'Hoạch định nhu cầu vận chuyển đa phương thức, tối ưu hóa luồng tồn kho và chi phí logistics khu vực miền Bắc, làm việc với đối tác FDI tại cảng Hải Phòng.',
    requirements: 'Tối thiểu 3 năm kinh nghiệm Supply Chain / Logistics tại doanh nghiệp lớn, tư duy tối ưu quy trình tốt, thành thạo Excel/Power BI và tiếng Anh lưu loát.',
    benefits: 'Thu nhập 24-38 triệu/tháng + thưởng cuối năm 2-4 tháng lương, xe đưa đón và bảo hiểm sức khỏe cho cả gia đình.',
    salary_min: 24000000,
    salary_max: 38000000,
    currency: 'VND',
    employment_type: 'full_time',
    experience_level: 'senior',
    deadline_days: 50,
    skills: ['Supply Chain', 'Xuất Nhập Khẩu', 'Excel Nâng Cao']
  },
  {
    company_slug: 'fpt-retail',
    category_slug: 'thuong-mai-dien-tu',
    location_slug: 'tp-ho-chi-minh',
    title: 'Chuyên Viên Vận Hành Thương Mại Điện Tử (E-Commerce)',
    slug: 'van-hanh-tmdt-fptretail-18',
    description: 'Quản trị vận hành gian hàng chính hãng trên Shopee, Lazada và TikTok Shop; triển khai chương trình Flash Sale, Mega Campaign và tối ưu tỷ lệ chuyển đổi đơn hàng.',
    requirements: 'Có từ 1 năm kinh nghiệm vận hành sàn TMĐT, biết đọc chỉ số traffic/CR, phối hợp tốt với bộ phận kho vận và thiết kế banner sản phẩm.',
    benefits: 'Lương 11-18 triệu + thưởng doanh số sàn hàng tháng, giảm giá nội bộ khi mua sản phẩm công nghệ tại FPT Shop.',
    salary_min: 11000000,
    salary_max: 18000000,
    currency: 'VND',
    employment_type: 'full_time',
    experience_level: 'junior',
    deadline_days: 40,
    skills: ['Vận Hành Sàn TMĐT', 'Shopee / TikTok Shop', 'Digital Marketing']
  },
  {
    company_slug: 'viettel-solutions',
    category_slug: 'an-toan-thong-tin',
    location_slug: 'ha-noi',
    title: 'Chuyên Viên An Toàn Thông Tin (SOC Analyst L1)',
    slug: 'soc-analyst-viettel-19',
    description: 'Giám sát an ninh mạng 24/7 trên hệ thống SIEM, phân tích cảnh báo tấn công mạng, điều tra nhật ký sự cố và phối hợp xử lý lỗ hổng bảo mật hạ tầng doanh nghiệp.',
    requirements: 'Nắm vững kiến thức mạng máy tính, Linux, phân tích log SIEM; ưu tiên ứng viên có chứng chỉ CompTIA Security+, CEH hoặc kinh nghiệm SOC.',
    benefits: 'Thu nhập 18-28 triệu/tháng + phụ cấp ca trực, thưởng thành tích quý và tài trợ thi chứng chỉ bảo mật quốc tế.',
    salary_min: 18000000,
    salary_max: 28000000,
    currency: 'VND',
    employment_type: 'full_time',
    experience_level: 'junior',
    deadline_days: 50,
    skills: ['SIEM / Bảo Mật Mạng', 'Linux', 'Python']
  },
  {
    company_slug: 'coteccons',
    category_slug: 'xay-dung-kien-truc',
    location_slug: 'tp-ho-chi-minh',
    title: 'Kỹ Sư Giám Sát Thi Công Xây Dựng (Site Engineer)',
    slug: 'giam-sat-thi-cong-coteccons-20',
    description: 'Trực tiếp giám sát chất lượng, tiến độ và an toàn lao động ngoài công trường; kiểm tra bản vẽ shop-drawing, nghiệm thu khối lượng hạng mục kết cấu và hoàn thiện.',
    requirements: 'Tốt nghiệp Đại học chuyên ngành Xây dựng Dân dụng & Công nghiệp, 1-3 năm kinh nghiệm thi công, sử dụng thành thạo AutoCAD, Revit BIM.',
    benefits: 'Lương 16-25 triệu + phụ cấp công trường, bảo hiểm tai nạn 24/7 và thưởng hoàn thành tiến độ dự án.',
    salary_min: 16000000,
    salary_max: 25000000,
    currency: 'VND',
    employment_type: 'full_time',
    experience_level: 'junior',
    deadline_days: 45,
    skills: ['AutoCAD / Revit BIM', 'Giám Sát Thi Công']
  },
  {
    company_slug: 'long-chau-pharma',
    category_slug: 'y-te-duoc-pham',
    location_slug: 'tp-ho-chi-minh',
    title: 'Dược Sĩ Tư Vấn & Quản Lý Nhà Thuốc Chuẩn GPP',
    slug: 'duoc-si-tu-van-longchau-21',
    description: 'Tư vấn sử dụng thuốc an toàn, hợp lý cho khách hàng theo đơn bác sĩ và phác đồ dược lâm sàng; kiểm soát tồn kho, hạn dùng và đảm bảo tiêu chuẩn nhà thuốc GPP.',
    requirements: 'Tốt nghiệp Cao đẳng/Đại học Dược, giao tiếp tận tâm, trung thực và có chứng chỉ hành nghề Dược là lợi thế lớn.',
    benefits: 'Thu nhập 12-18 triệu (lương cứng + thưởng doanh số), đóng BHXH đầy đủ và đào tạo chuyên môn định kỳ cùng bác sĩ chuyên khoa.',
    salary_min: 12000000,
    salary_max: 18000000,
    currency: 'VND',
    employment_type: 'full_time',
    experience_level: 'fresher',
    deadline_days: 45,
    skills: ['Dược Lâm Sàng GPP']
  },
  {
    company_slug: 'vus-education',
    category_slug: 'giao-duc-dao-tao',
    location_slug: 'tp-ho-chi-minh',
    title: 'Chuyên Viên Tư Vấn Tuyển Sinh & Lộ Trình Học Thuật',
    slug: 'tu-van-tuyen-sinh-vus-22',
    description: 'Tiếp nhận thông tin phụ huynh/học viên, tư vấn lộ trình học tiếng Anh phù hợp năng lực, hỗ trợ sắp xếp kiểm tra đầu vào và chăm sóc học viên trong suốt khóa học.',
    requirements: 'Tốt nghiệp Cao đẳng/Đại học, giọng nói truyền cảm, giao tiếp khéo léo, yêu thích môi trường giáo dục và chịu được KPI tuyển sinh.',
    benefits: 'Lương cứng 9-12 triệu + thưởng tuyển sinh (thu nhập 12-22 triệu), học bổng tiếng Anh cho nhân viên và người thân.',
    salary_min: 11000000,
    salary_max: 20000000,
    currency: 'VND',
    employment_type: 'full_time',
    experience_level: 'fresher',
    deadline_days: 45,
    skills: ['Tư Vấn Tuyển Sinh', 'Sales B2B']
  },
  {
    company_slug: 'bosch-vietnam',
    category_slug: 'co-khi-san-xuat',
    location_slug: 'binh-duong',
    title: 'Kỹ Sư Tự Động Hóa & Bảo Trì Dây Chuyền (PLC)',
    slug: 'ky-su-tu-dong-hoa-plc-bosch-23',
    description: 'Lập trình, hiệu chỉnh hệ thống điều khiển tự động PLC Siemens/Mitsubishi, giám sát dây chuyền sản xuất thông minh Industry 4.0 và tối ưu hiệu suất thiết bị OEE.',
    requirements: 'Tốt nghiệp Kỹ sư Tự động hóa/Cơ điện tử, 2 năm kinh nghiệm vận hành nhà máy, đọc hiểu tài liệu kỹ thuật tiếng Anh và am hiểu PLC/SCADA.',
    benefits: 'Thu nhập 18-28 triệu/tháng, xe đưa đón từ TP.HCM đi Bình Dương, cơm trưa miễn phí và thưởng 2 tháng lương cuối năm.',
    salary_min: 18000000,
    salary_max: 28000000,
    currency: 'VND',
    employment_type: 'full_time',
    experience_level: 'middle',
    deadline_days: 50,
    skills: ['Tự Động Hóa PLC', 'Excel Nâng Cao']
  }
];

async function ensureMultiIndustryData() {
  const dbName = (process.env.DB_NAME || 'job_portal_db').replace(/`/g, '');
  const conn = await mysql.createConnection(buildDbConfig({ database: dbName }));

  try {
    // Luôn đồng bộ logo ảnh thật nội bộ cho các doanh nghiệp hiện hữu
    for (const [slug, logoPath] of Object.entries(COMPANY_LOGOS)) {
      await conn.query(
        'UPDATE companies SET logo_url = ? WHERE slug = ? AND (logo_url IS NULL OR logo_url = "" OR logo_url LIKE "http%")',
        [logoPath, slug]
      );
    }

    const [existingCat] = await conn.query(
      "SELECT COUNT(*) AS cnt FROM categories WHERE slug IN ('xay-dung-kien-truc', 'y-te-duoc-pham', 'giao-duc-dao-tao', 'co-khi-san-xuat')"
    );
    const [existingJob] = await conn.query(
      "SELECT COUNT(*) AS cnt FROM jobs WHERE slug = 'ky-su-tu-dong-hoa-plc-bosch-23'"
    );
    if (Number(existingCat[0]?.cnt) >= 4 && Number(existingJob[0]?.cnt) >= 1) {
      return { seeded: false, reason: 'already_present' };
    }

    for (const loc of NEW_LOCATIONS) {
      await conn.query(
        'INSERT IGNORE INTO locations (location_name, slug) VALUES (?, ?)',
        [loc.name, loc.slug]
      );
    }

    for (const cat of NEW_CATEGORIES) {
      await conn.query(
        'INSERT IGNORE INTO categories (category_name, slug, description) VALUES (?, ?, ?)',
        [cat.name, cat.slug, cat.description]
      );
    }

    for (const sk of NEW_SKILLS) {
      await conn.query(
        'INSERT IGNORE INTO skills (skill_name, slug) VALUES (?, ?)',
        [sk.name, sk.slug]
      );
    }

    for (const emp of NEW_EMPLOYERS) {
      await conn.query(
        `INSERT IGNORE INTO users (full_name, email, password_hash, phone, role, status)
         VALUES (?, ?, ?, ?, 'employer', 'active')`,
        [emp.full_name, emp.email, DEMO_PASSWORD_HASH, emp.phone]
      );
      const [uRows] = await conn.query('SELECT user_id FROM users WHERE email = ? LIMIT 1', [emp.email]);
      const userId = uRows[0]?.user_id;
      const logoUrl = COMPANY_LOGOS[emp.slug] || null;
      if (userId) {
        await conn.query(
          `INSERT IGNORE INTO companies (user_id, company_name, slug, tax_code, logo_url, website, address, description)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [userId, emp.company_name, emp.slug, emp.tax_code, logoUrl, emp.website, emp.address, emp.description]
        );
      }
    }

    // Đảm bảo logo được gán lại cho tất cả công ty vừa tạo
    for (const [slug, logoPath] of Object.entries(COMPANY_LOGOS)) {
      await conn.query('UPDATE companies SET logo_url = ? WHERE slug = ?', [logoPath, slug]);
    }

    const [catRows] = await conn.query('SELECT category_id, slug FROM categories');
    const [locRows] = await conn.query('SELECT location_id, slug FROM locations');
    const [compRows] = await conn.query('SELECT company_id, slug FROM companies');
    const [skillRows] = await conn.query('SELECT skill_id, skill_name FROM skills');

    const catMap = new Map(catRows.map((r) => [r.slug, r.category_id]));
    const locMap = new Map(locRows.map((r) => [r.slug, r.location_id]));
    const compMap = new Map(compRows.map((r) => [r.slug, r.company_id]));
    const skillMap = new Map(skillRows.map((r) => [r.skill_name.toLowerCase(), r.skill_id]));

    let insertedJobs = 0;
    for (let i = 0; i < NEW_JOBS.length; i += 1) {
      const job = NEW_JOBS[i];
      const companyId = compMap.get(job.company_slug);
      const categoryId = catMap.get(job.category_slug);
      const locationId = locMap.get(job.location_slug);
      if (!companyId || !categoryId || !locationId) continue;

      const [res] = await conn.query(
        `INSERT IGNORE INTO jobs
         (company_id, category_id, location_id, title, slug, description, requirements, benefits,
          salary_min, salary_max, currency, employment_type, experience_level, deadline, status, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, DATE_ADD(CURDATE(), INTERVAL ? DAY), 'approved', DATE_ADD(NOW(), INTERVAL ? SECOND))`,
        [
          companyId,
          categoryId,
          locationId,
          job.title,
          job.slug,
          job.description,
          job.requirements,
          job.benefits,
          job.salary_min,
          job.salary_max,
          job.currency,
          job.employment_type,
          job.experience_level,
          job.deadline_days,
          i + 1
        ]
      );

      if (res.affectedRows > 0) insertedJobs += 1;

      const [jRows] = await conn.query('SELECT job_id FROM jobs WHERE slug = ? LIMIT 1', [job.slug]);
      const jobId = jRows[0]?.job_id;
      if (jobId && Array.isArray(job.skills)) {
        for (const skName of job.skills) {
          const skId = skillMap.get(skName.toLowerCase());
          if (skId) {
            await conn.query(
              'INSERT IGNORE INTO job_skills (job_id, skill_id) VALUES (?, ?)',
              [jobId, skId]
            );
          }
        }
      }
    }

    console.log(`[Seed Multi-Industry] Đã bổ sung ${insertedJobs} việc làm mới trên 16 nhóm ngành & cập nhật logo thật.`);
    return { seeded: true, insertedJobs };
  } catch (err) {
    console.warn('[Seed Multi-Industry] Cảnh báo:', err.message);
    return { seeded: false, error: err.message };
  } finally {
    await conn.end();
  }
}

if (require.main === module) {
  ensureMultiIndustryData()
    .then((res) => {
      console.log('[Seed Multi-Industry] Kết quả:', res);
      process.exit(0);
    })
    .catch((err) => {
      console.error('[Seed Multi-Industry] Lỗi:', err.message);
      process.exit(1);
    });
}

module.exports = { ensureMultiIndustryData };
