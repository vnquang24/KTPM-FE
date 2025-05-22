#!/bin/bash

# Màu sắc cho output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== CÔNG CỤ XÓA COMMENT TRONG THƯ MỤC SRC ===${NC}"
echo ""

# Kiểm tra Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js không được cài đặt. Vui lòng cài đặt Node.js để tiếp tục.${NC}"
    exit 1
fi

# Hỏi người dùng có muốn tạo bản sao lưu không
echo -e "${YELLOW}Bạn có muốn tạo bản sao lưu trước khi xóa comment không? (y/n)${NC}"
read -p "> " backup_choice

BACKUP_FLAG=""
if [[ $backup_choice == "y" || $backup_choice == "Y" ]]; then
    BACKUP_FLAG="--backup"
    echo -e "${GREEN}✅ Sẽ tạo bản sao lưu.${NC}"
else
    echo -e "${YELLOW}⚠️ Không tạo bản sao lưu. Các thay đổi sẽ không thể hoàn tác.${NC}"
    
    # Xác nhận lại nếu không tạo backup
    echo -e "${YELLOW}Bạn có chắc chắn muốn tiếp tục mà không tạo bản sao lưu? (y/n)${NC}"
    read -p "> " confirm
    
    if [[ $confirm != "y" && $confirm != "Y" ]]; then
        echo -e "${RED}❌ Đã hủy thao tác.${NC}"
        exit 0
    fi
fi

echo ""
echo -e "${BLUE}Bắt đầu xóa comment...${NC}"
echo ""

# Chạy script xóa comment
node remove-comments.js $BACKUP_FLAG

# Kiểm tra kết quả
if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Hoàn tất quá trình xóa comment!${NC}"
else
    echo ""
    echo -e "${RED}❌ Đã xảy ra lỗi trong quá trình xóa comment.${NC}"
fi