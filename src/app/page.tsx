import { Camera } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  return (
    <div className = 'flex justify-between'>
      <h1 className='text-blue-500 border-2 border-gray-300 p-4'>Đây là FE của cứu hộ cứu nạn</h1>
      <Link href='/login'>     
       <Camera size='100' className='ml-4 cursor-pointer' />
      </Link>
    </div>
  );
}
