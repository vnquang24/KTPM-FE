const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Các định dạng file cần xử lý
const FILE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.css', '.scss'];

// Đường dẫn thư mục src
const SRC_DIR = path.join(__dirname, 'src');

// Thư mục backup
const BACKUP_DIR = path.join(__dirname, 'src_backup_' + new Date().toISOString().replace(/[:.]/g, '-'));

// Đếm số lượng file đã xử lý và số lượng dòng comment đã xóa
let processedFiles = 0;
let removedLines = 0;
let totalFiles = 0;

// Tạo backup nếu cần
const createBackup = process.argv.includes('--backup');
if (createBackup) {
  console.log(`📦 Đang tạo bản sao lưu thư mục src...`);
  
  try {
    // Kiểm tra xem thư mục src có tồn tại không
    if (!fs.existsSync(SRC_DIR)) {
      console.error(`❌ Thư mục src không tồn tại: ${SRC_DIR}`);
      process.exit(1);
    }
    
    // Tạo thư mục backup
    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }
    
    // Sử dụng fs-extra để copy toàn bộ thư mục
    try {
      // Phương pháp 1: Sử dụng child_process để chạy lệnh copy
      if (process.platform === 'win32') {
        // Windows
        execSync(`xcopy "${SRC_DIR}" "${BACKUP_DIR}" /E /I /H`);
      } else {
        // Linux/Mac
        execSync(`cp -R "${SRC_DIR}/." "${BACKUP_DIR}"`);
      }
      console.log(`✅ Đã sao lưu thư mục src vào: ${BACKUP_DIR}`);
    } catch (err) {
      // Phương pháp 2: Sử dụng fs để copy thủ công nếu phương pháp 1 thất bại
      console.log(`⚠️ Không thể sử dụng lệnh hệ thống để copy, đang chuyển sang phương pháp thủ công...`);
      copyFolderRecursiveSync(SRC_DIR, BACKUP_DIR);
      console.log(`✅ Đã sao lưu thư mục src vào: ${BACKUP_DIR}`);
    }
  } catch (error) {
    console.error(`❌ Lỗi khi tạo bản sao lưu: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Hàm copy thư mục và nội dung của nó một cách đệ quy
 * @param {string} source Thư mục nguồn
 * @param {string} target Thư mục đích
 */
function copyFolderRecursiveSync(source, target) {
  // Kiểm tra xem thư mục đích có tồn tại không, nếu không thì tạo mới
  if (!fs.existsSync(target)) {
    fs.mkdirSync(target, { recursive: true });
  }

  // Đọc tất cả các mục trong thư mục nguồn
  const items = fs.readdirSync(source);

  // Duyệt qua từng mục
  items.forEach(item => {
    const currentSource = path.join(source, item);
    const currentTarget = path.join(target, item);
    
    // Kiểm tra xem mục hiện tại có phải là thư mục hay không
    if (fs.lstatSync(currentSource).isDirectory()) {
      // Nếu là thư mục, gọi đệ quy để copy thư mục con
      copyFolderRecursiveSync(currentSource, currentTarget);
    } else {
      // Nếu là file, copy file
      fs.copyFileSync(currentSource, currentTarget);
    }
  });
}

/**
 * Xóa các dòng comment bắt đầu bằng // hoặc {/*
 * @param {string} content Nội dung file
 * @param {string} filePath Đường dẫn file
 * @returns {string} Nội dung đã xóa comment
 */
function removeComments(content, filePath) {
  // Bỏ qua các file được đánh dấu là không xóa comment
  if (content.includes('@preserve-comments') || content.includes('@keep-comments')) {
    console.log(`⏭️ Bỏ qua file (được đánh dấu giữ lại comment): ${filePath}`);
    return content;
  }

  // Tách nội dung thành các dòng
  const lines = content.split('\n');
  // Lọc ra các dòng không bắt đầu bằng // hoặc {/* (sau khi bỏ qua khoảng trắng)
  const filteredLines = lines.filter(line => {
    const trimmedLine = line.trim();
    // Giữ lại dòng nếu nó không bắt đầu bằng // hoặc {/*
    return !trimmedLine.startsWith('//') && !trimmedLine.startsWith('{/*');
  });
  
  // Đếm số dòng đã xóa
  const removedCount = lines.length - filteredLines.length;
  removedLines += removedCount;
  
  // Nối các dòng lại thành một chuỗi
  return filteredLines.join('\n');
}

/**
 * Xử lý file
 * @param {string} filePath Đường dẫn file
 */
function processFile(filePath) {
  const ext = path.extname(filePath);
  totalFiles++;
  
  // Kiểm tra xem file có thuộc định dạng cần xử lý không
  if (FILE_EXTENSIONS.includes(ext)) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const newContent = removeComments(content, filePath);
      
      // Chỉ ghi lại nếu nội dung thay đổi
      if (content !== newContent) {
        // Ghi file mới
        fs.writeFileSync(filePath, newContent, 'utf8');
        console.log(`✅ Đã xử lý: ${path.relative(SRC_DIR, filePath)}`);
        processedFiles++;
      }
    } catch (error) {
      console.error(`❌ Lỗi khi xử lý file ${filePath}:`, error.message);
    }
  }
}

/**
 * Duyệt qua tất cả các file trong thư mục
 * @param {string} dir Đường dẫn thư mục
 */
function traverseDirectory(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stats = fs.statSync(filePath);
    
    if (stats.isDirectory()) {
      // Đệ quy vào thư mục con
      traverseDirectory(filePath);
    } else {
      // Xử lý file
      processFile(filePath);
    }
  });
}

// Hiển thị hướng dẫn sử dụng
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
  Công cụ xóa comment trong thư mục src
  
  Cách sử dụng:
    node remove-comments.js [tùy chọn]
    
  Tùy chọn:
    --backup    Tạo bản sao lưu toàn bộ thư mục src trước khi xóa comment
    --help, -h  Hiển thị hướng dẫn này
  
  Lưu ý:
    - Thêm '@preserve-comments' hoặc '@keep-comments' vào file để giữ lại comment
    - Script xóa các dòng bắt đầu bằng // hoặc {/* (sau khi bỏ qua khoảng trắng)
  `);
  process.exit(0);
}

// Bắt đầu xử lý
console.log('Bắt đầu xóa các dòng comment trong thư mục src...');
console.log(createBackup ? '📦 Chế độ sao lưu: BẬT' : '📦 Chế độ sao lưu: TẮT');
console.time('⏱️ Thời gian thực thi');

try {
  traverseDirectory(SRC_DIR);
  
  console.log(`\n✅ Hoàn thành!`);
  console.log(`📊 Tổng số file quét: ${totalFiles}`);
  console.log(`📊 Số file đã xử lý: ${processedFiles}`);
  console.log(`📊 Đã xóa ${removedLines} dòng comment bắt đầu bằng //`);
  
  if (createBackup) {
    console.log(`📁 Bản sao lưu được lưu tại: ${BACKUP_DIR}`);
  }
} catch (error) {
  console.error('❌ Đã xảy ra lỗi:', error.message);
}

console.timeEnd('⏱️ Thời gian thực thi'); 