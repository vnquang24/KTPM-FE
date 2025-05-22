import React, { useEffect, useState } from 'react';

interface DarkModePopupProps {
  onClose: () => void;
}

const DarkModePopup: React.FC<DarkModePopupProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
        <h2 className="mb-4 text-xl font-bold text-red-600">Cảnh báo!</h2>
        <p className="mb-3 text-gray-700">
          Vui lòng tắt chế độ Dark Mode trên trình duyệt của bạn để có trải nghiệm tốt nhất với trang web của chúng tôi.
        </p>
        <p className="mb-6 text-sm text-gray-500">
          <strong>Lưu ý:</strong> Thông báo này sẽ xuất hiện lại mỗi khi bạn truy cập trang web cho đến khi bạn tắt chế độ Dark Mode.
        </p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="rounded bg-gray-300 px-4 py-2 font-medium text-gray-700 hover:bg-gray-400"
          >
            Tiếp tục dù vậy
          </button>
          <button
            onClick={() => {
              window.open('https://support.google.com/chrome/answer/9275525?hl=vi', '_blank');
            }}
            className="rounded bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
          >
            Hướng dẫn tắt Dark Mode
          </button>
        </div>
      </div>
    </div>
  );
};

export default DarkModePopup; 