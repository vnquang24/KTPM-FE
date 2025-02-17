import { ArchiveX, Boxes, FileChartColumn, FileDown, FileUp, HandHelping, HardDrive, Import, KeyRound, Monitor, MonitorSmartphone, Proportions, School, UserRoundCog, Users, Warehouse, Wrench } from 'lucide-react';

const useMenuList = () => {
  return [
    {
      label: 'Báo cáo',
      menus: [
        {
          href: '/report',
          icon: FileChartColumn,
          label: 'Báo cáo tổng hợp',
        },
      ],
    },
    {
      label: '',
      menus: [
        {
          href: '/equipment-organization',
          label: 'Thiết bị của đơn vị',
          icon: HardDrive,
        },
        {
          href: '/equipment-warehouse',
          label: 'Thiết bị trong kho',
          icon: Warehouse,
        },
      ],
    },
    {
      label: 'Thiết bị',
      menus: [
        {
          href: '/equipment-import',
          label: 'Nhập kho',
          icon: FileDown,
        },
        {
          href: '/equipment-export',
          label: 'Xuất kho',
          icon: FileUp,
        },
        {
          href: '/equipment-hand-over',
          label: 'Luân chuyển',
          icon: HandHelping,
        },
        {
          href: '/equipment-liquidation',
          label: 'Thanh lý',
          icon: ArchiveX,
        },
      ],
    },
    {
      label: 'Đề xuất',
      menus: [
        {
          href: '/equipment-request-export',
          label: 'Đề xuất cấp thiết bị',
          icon: Import,
        },
        {
          href: '/equipment-request-revamp',
          label: 'Đề xuất sửa chữa',
          icon: Wrench,
        },
        {
          href: '/equipment-request-liquidation',
          label: 'Đề xuất thanh lý',
          icon: ArchiveX,
        },
      ],
    },
    {
      label: 'Sửa chữa',
      menus: [
        {
          href: '/equipment-revamp',
          label: 'Sửa chữa thiết bị',
          icon: Wrench,
        },
      ],
    },
    {
      label: 'Người dùng và phân quyền',
      menus: [
        {
          href: '/user-permission-account',
          label: 'Tài khoản người dùng',
          icon: Users,
          description: 'Quản lý tài khoản người dùng',
        },
        {
          href: '/user-permission-role',
          label: 'Vai trò',
          icon: UserRoundCog,
          description: 'Quản lý vai trò người dùng',
        },
        {
          href: '/user-permission-basic-permission',
          label: 'Quyền cơ bản',
          icon: KeyRound,
          description: 'Quản lý quyền chức năng cơ bản',
        },
      ],
    },
    {
      label: 'Thiết lập dữ liệu',
      menus: [
        {
          href: '/common-organization',
          label: 'Đơn vị',
          icon: Boxes,
        },
        {
          href: '/common-warehouse',
          label: 'Kho thiết bị',
          icon: Warehouse,
        },
        {
          href: '/common-equipment-group-type',
          label: 'Nhóm thiết bị',
          description: 'Quản lý danh mục nhóm thiết bị',
          icon: Proportions,
        },
        {
          href: '/common-equipment-type',
          label: 'Loại thiết bị',
          description: 'Quản lý danh mục loại thiết bị',
          icon: Monitor,
        },
        {
          href: '/common-equipment',
          label: 'Thiết bị',
          icon: MonitorSmartphone,
        },
        {
          href: '',
          label: 'Toà nhà và phòng',
          icon: School,
          menus: [
            {
              href: '/common-building-room-building',
              label: 'Toà nhà',
              description: 'Quản lý danh mục toà nhà',
            },
            {
              href: '/common-building-room-room',
              label: 'Phòng',
              description: 'Quản lý danh mục phòng',
            },
          ],
        },
      ],
    },
  ];
};

export { useMenuList };