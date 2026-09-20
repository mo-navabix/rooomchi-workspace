/**
 * OpenAPI 3.0.0 Specification for Didar Multi-Tenant Meeting Room Reservation Platform
 */
export const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'Didar B2B Meeting Room Platform API',
    version: '1.0.0',
    description: `مستندات تعاملی وب‌سرویس‌های پلتفرم چندسازمانی رزرو اتاق جلسه و همایش **دیدار (Didar)**.
این مستندات کلیه اندپوینت‌های احراز هویت، مدیریت سازمان‌ها (Tenants)، مدیریت اتاق‌ها و سالن‌های کنفرانس، رزرو جلسات، کنترل دسترسی مبتنی بر نقش (RBAC) و آمار را در بر می‌گیرد.`,
    contact: {
      name: 'پشتیبانی فنی سامانه دیدار',
      url: 'https://didarhub.ir',
      email: 'support@didarhub.ir',
    },
  },
  servers: [
    {
      url: '/api',
      description: 'سرور جاری (Current Environment API Base)',
    },
    {
      url: 'https://app.didarhub.ir/api',
      description: 'محیط عملیاتی دیدار (Production)',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'توکن JWT دریافتی از اندپوینت لاگین (مانند: Bearer eyJhbGciOi...)',
      },
    },
    schemas: {
      LoginDto: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: {
            type: 'string',
            format: 'email',
            example: 'admin@technova.ir',
            description: 'ایمیل کاربر در سازمان',
          },
          password: {
            type: 'string',
            format: 'password',
            example: 'admin123',
            description: 'رمز عبور',
          },
          orgId: {
            type: 'string',
            example: 'org-technova',
            description: 'شناسه سازمان اختیاری (یا تشخیص بر اساس ساب‌دامین / هدر)',
          },
        },
      },
      AuthResponseDto: {
        type: 'object',
        properties: {
          accessToken: {
            type: 'string',
            example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          },
          user: {
            $ref: '#/components/schemas/UserDto',
          },
          organization: {
            $ref: '#/components/schemas/OrganizationDto',
          },
        },
      },
      OrganizationDto: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'org-technova' },
          name: { type: 'string', example: 'تکنوا پیشرو' },
          code: { type: 'string', example: 'technova' },
          slug: { type: 'string', example: 'technova' },
          domain: { type: 'string', example: 'technova.didarhub.ir' },
          status: { type: 'string', example: 'ACTIVE' },
          plan: { type: 'string', enum: ['starter', 'business', 'enterprise'], example: 'enterprise' },
          contactEmail: { type: 'string', example: 'it@technova.ir' },
          buildings: {
            type: 'array',
            items: { type: 'string' },
            example: ['ساختمان مرکزی', 'مرکز نوآوری'],
          },
          settings: {
            type: 'object',
            properties: {
              autoApprove: { type: 'boolean', example: true },
              maxBookingHours: { type: 'number', example: 4 },
              allowWeekend: { type: 'boolean', example: false },
            },
          },
        },
      },
      CreateOrganizationDto: {
        type: 'object',
        required: ['name', 'code', 'adminEmail'],
        properties: {
          name: { type: 'string', example: 'شرکت فناوران همراه' },
          code: { type: 'string', example: 'fanavaran' },
          adminEmail: { type: 'string', format: 'email', example: 'admin@fanavaran.ir' },
          adminName: { type: 'string', example: 'مهندس رضایی' },
          plan: { type: 'string', enum: ['starter', 'business', 'enterprise'], default: 'business' },
          domain: { type: 'string', example: 'fanavaran.didarhub.ir' },
          buildings: { type: 'array', items: { type: 'string' }, example: ['برج فناوران'] },
        },
      },
      RoomDto: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'room-1' },
          orgId: { type: 'string', example: 'org-technova' },
          name: { type: 'string', example: 'اتاق جلسات فردوسی' },
          code: { type: 'string', example: 'FER-101' },
          floor: { type: 'number', example: 1 },
          building: { type: 'string', example: 'ساختمان مرکزی' },
          capacity: { type: 'number', example: 12 },
          amenities: {
            type: 'array',
            items: { type: 'string' },
            example: ['video_conf', 'projector', 'whiteboard', 'catering'],
          },
          imageUrl: { type: 'string', format: 'uri' },
          status: { type: 'string', enum: ['available', 'maintenance', 'inactive'], example: 'available' },
          color: { type: 'string', example: '#2563EB' },
          requiresApproval: { type: 'boolean', example: false },
        },
      },
      CreateRoomDto: {
        type: 'object',
        required: ['name', 'code', 'capacity'],
        properties: {
          name: { type: 'string', example: 'اتاق جلسات ابوعلی سینا' },
          code: { type: 'string', example: 'SINA-201' },
          orgId: { type: 'string', example: 'org-technova' },
          capacity: { type: 'number', example: 16 },
          floor: { type: 'number', example: 2 },
          building: { type: 'string', example: 'مرکز نوآوری' },
          amenities: { type: 'array', items: { type: 'string' } },
          status: { type: 'string', enum: ['available', 'maintenance', 'inactive'], default: 'available' },
          requiresApproval: { type: 'boolean', default: false },
        },
      },
      BookingDto: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'booking-101' },
          orgId: { type: 'string', example: 'org-technova' },
          roomId: { type: 'string', example: 'room-1' },
          roomName: { type: 'string', example: 'اتاق جلسات فردوسی' },
          title: { type: 'string', example: 'جلسه بازنگری اسپرینت' },
          description: { type: 'string', example: 'بررسی فیچرهای جدید ریلیز دیدار' },
          organizerName: { type: 'string', example: 'علی محمدی' },
          organizerEmail: { type: 'string', example: 'admin@technova.ir' },
          department: { type: 'string', example: 'توسعه محصول' },
          date: { type: 'string', format: 'date', example: '2026-09-20' },
          startTime: { type: 'string', example: '10:00' },
          endTime: { type: 'string', example: '11:30' },
          attendeesCount: { type: 'number', example: 8 },
          equipmentNeeded: { type: 'array', items: { type: 'string' }, example: ['video_conf', 'catering'] },
          cateringNeeded: { type: 'boolean', example: true },
          status: {
            type: 'string',
            enum: ['confirmed', 'pending_approval', 'cancelled', 'completed'],
            example: 'confirmed',
          },
        },
      },
      CreateBookingDto: {
        type: 'object',
        required: ['roomId', 'title', 'date', 'startTime', 'endTime', 'attendeesCount'],
        properties: {
          roomId: { type: 'string', example: 'room-1' },
          title: { type: 'string', example: 'جلسه هماهنگی تیم فرانت‌اند' },
          description: { type: 'string', example: 'بررسی طراحی رابط کاربری دیدار' },
          date: { type: 'string', format: 'date', example: '2026-09-20' },
          startTime: { type: 'string', example: '14:00' },
          endTime: { type: 'string', example: '15:30' },
          attendeesCount: { type: 'number', example: 6 },
          department: { type: 'string', example: 'فنی' },
          equipmentNeeded: { type: 'array', items: { type: 'string' } },
          cateringNeeded: { type: 'boolean', default: false },
        },
      },
      UserDto: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'user-1' },
          name: { type: 'string', example: 'علی محمدی' },
          email: { type: 'string', example: 'admin@technova.ir' },
          orgId: { type: 'string', example: 'org-technova' },
          role: {
            type: 'string',
            enum: ['employee', 'room_manager', 'org_admin', 'super_admin'],
            example: 'org_admin',
          },
          department: { type: 'string', example: 'فناوری اطلاعات' },
          jobTitle: { type: 'string', example: 'مدیر ارشد زیرساخت' },
          phone: { type: 'string', example: '09121112233' },
          status: { type: 'string', enum: ['active', 'suspended'], example: 'active' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      CreateUserDto: {
        type: 'object',
        required: ['name', 'email', 'role', 'department'],
        properties: {
          name: { type: 'string', example: 'سارا احمدی' },
          email: { type: 'string', format: 'email', example: 'sara@technova.ir' },
          role: { type: 'string', enum: ['employee', 'room_manager', 'org_admin'], example: 'employee' },
          department: { type: 'string', example: 'مارکتینگ' },
          jobTitle: { type: 'string', example: 'کارشناس ارشد سئو' },
          phone: { type: 'string', example: '09128889900' },
        },
      },
      StatsDto: {
        type: 'object',
        properties: {
          totalRooms: { type: 'number', example: 8 },
          todayBookingsCount: { type: 'number', example: 5 },
          activeMeetingsNow: { type: 'number', example: 2 },
          totalHistoricalBookings: { type: 'number', example: 48 },
        },
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          statusCode: { type: 'number', example: 400 },
          error: { type: 'string', example: 'Bad Request' },
          message: { type: 'string', example: 'تداخل زمانی با رزرو دیگری وجود دارد' },
        },
      },
    },
  },
  tags: [
    { name: 'Authentication', description: 'عملیات لاگین، دریافت اطلاعات کاربر لاگین‌شده و بازنشانی رمز عبور' },
    { name: 'Organizations', description: 'مدیریت و پروویژن سازمان‌های B2B و تنظیمات ایزولاسیون چندمستأجره' },
    { name: 'Rooms', description: 'مدیریت سالن‌های همایش و اتاق‌های جلسات و جستجوی امکانات' },
    { name: 'Bookings', description: 'فرآیند ثبت، بررسی، تایید و لغو رزروها و حل تداخل زمانی' },
    { name: 'Users & RBAC', description: 'مدیریت کاربران سازمان و کنترل سطوح دسترسی مبتنی بر نقش' },
    { name: 'Analytics & Stats', description: 'آمار کارکرد و وضعیت لحظه‌ای سازمان' },
    { name: 'System & Health', description: 'بررسی وضعیت سلامت سرور و اتصال پایگاه‌داده PostgreSQL' },
  ],
  paths: {
    '/api/auth/login': {
      post: {
        tags: ['Authentication'],
        summary: 'ورود به حساب کاربری (JWT Login)',
        description: 'احراز هویت کاربر سازمانی و صدور Access Token با قابلیت شناسایی چندمستأجره.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/LoginDto' },
            },
          },
        },
        responses: {
          '200': {
            description: 'ورود موفقیت‌آمیز',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AuthResponseDto' },
              },
            },
          },
          '401': {
            description: 'ایمیل یا رمز عبور نامعتبر است',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
          },
        },
      },
    },
    '/api/auth/me': {
      get: {
        tags: ['Authentication'],
        summary: 'دریافت مشخصات کاربر احراز هویت‌شده جاری',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'اطلاعات پروفایل کاربر',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/UserDto' } } },
          },
          '401': { description: 'کاربر وارد نشده است' },
        },
      },
    },
    '/api/organizations': {
      get: {
        tags: ['Organizations'],
        summary: 'دریافت لیست کلیه سازمان‌های ثبت‌شده در پلتفرم',
        responses: {
          '200': {
            description: 'لیست سازمان‌ها',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/OrganizationDto' },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Organizations'],
        summary: 'راه‌اندازی و پروویژن سازمان B2B جدید (Tenant Onboarding)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateOrganizationDto' },
            },
          },
        },
        responses: {
          '201': {
            description: 'سازمان با موفقیت ایجاد شد',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/OrganizationDto' } } },
          },
        },
      },
    },
    '/api/organizations/{id}': {
      get: {
        tags: ['Organizations'],
        summary: 'دریافت مشخصات و تنظیمات تفصیلی سازمان',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'شناسه سازمان' },
        ],
        responses: {
          '200': {
            description: 'اطلاعات سازمان',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/OrganizationDto' } } },
          },
          '404': { description: 'سازمان یافت نشد' },
        },
      },
      put: {
        tags: ['Organizations'],
        summary: 'بروزرسانی تنظیمات و اطلاعات سازمان',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/OrganizationDto' },
            },
          },
        },
        responses: {
          '200': { description: 'بروزرسانی موفق' },
        },
      },
    },
    '/api/rooms': {
      get: {
        tags: ['Rooms'],
        summary: 'دریافت فهرست اتاق‌های سازمان با فیلتر امکانات و ظرفیت',
        parameters: [
          { name: 'orgId', in: 'query', schema: { type: 'string' }, description: 'شناسه سازمان' },
          { name: 'capacity', in: 'query', schema: { type: 'number' }, description: 'حداقل ظرفیت' },
          { name: 'building', in: 'query', schema: { type: 'string' }, description: 'نام ساختمان' },
        ],
        responses: {
          '200': {
            description: 'فهرست اتاق‌ها',
            content: {
              'application/json': {
                schema: { type: 'array', items: { $ref: '#/components/schemas/RoomDto' } },
              },
            },
          },
        },
      },
      post: {
        tags: ['Rooms'],
        summary: 'ایجاد اتاق یا سالن همایش جدید',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/CreateRoomDto' } },
          },
        },
        responses: {
          '201': {
            description: 'اتاق جدید ایجاد گردید',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/RoomDto' } } },
          },
        },
      },
    },
    '/api/rooms/{id}': {
      get: {
        tags: ['Rooms'],
        summary: 'دریافت مشخصات یک اتاق بر اساس شناسه',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': {
            content: { 'application/json': { schema: { $ref: '#/components/schemas/RoomDto' } } },
          },
        },
      },
      put: {
        tags: ['Rooms'],
        summary: 'ویرایش مشخصات اتاق',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateRoomDto' } } },
        },
        responses: {
          '200': { description: 'ویرایش با موفقیت انجام شد' },
        },
      },
      delete: {
        tags: ['Rooms'],
        summary: 'حذف اتاق از سامانه',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'اتاق حذف شد' },
        },
      },
    },
    '/api/bookings': {
      get: {
        tags: ['Bookings'],
        summary: 'دریافت رزروهای جلسه بر اساس تاریخ، سازمان و اتاق',
        parameters: [
          { name: 'orgId', in: 'query', schema: { type: 'string' } },
          { name: 'date', in: 'query', schema: { type: 'string', format: 'date' }, description: 'تاریخ روز YYYY-MM-DD' },
          { name: 'roomId', in: 'query', schema: { type: 'string' } },
        ],
        responses: {
          '200': {
            description: 'فهرست رزروها',
            content: {
              'application/json': {
                schema: { type: 'array', items: { $ref: '#/components/schemas/BookingDto' } },
              },
            },
          },
        },
      },
      post: {
        tags: ['Bookings'],
        summary: 'ثبت رزرو جدید با بررسی تداخل زمانی و تطابق ظرفیت',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/CreateBookingDto' } },
          },
        },
        responses: {
          '201': {
            description: 'رزرو با موفقیت ثبت شد',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/BookingDto' } } },
          },
          '409': {
            description: 'تداخل زمانی با رزرو دیگری وجود دارد',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
          },
        },
      },
    },
    '/api/bookings/{id}': {
      patch: {
        tags: ['Bookings'],
        summary: 'تغییر وضعیت رزرو (تایید / رد / تکمیل)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  status: { type: 'string', enum: ['confirmed', 'cancelled', 'completed'] },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'وضعیت رزرو تغییر کرد' },
        },
      },
      delete: {
        tags: ['Bookings'],
        summary: 'لغو جلسه رزرو شده',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'جلسه با موفقیت لغو شد' },
        },
      },
    },
    '/api/users': {
      get: {
        tags: ['Users & RBAC'],
        summary: 'دریافت فهرست کاربران سازمان جاری',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'orgId', in: 'query', schema: { type: 'string' }, description: 'شناسه سازمان' },
        ],
        responses: {
          '200': {
            description: 'لیست کاربران',
            content: {
              'application/json': {
                schema: { type: 'array', items: { $ref: '#/components/schemas/UserDto' } },
              },
            },
          },
        },
      },
      post: {
        tags: ['Users & RBAC'],
        summary: 'افزودن کاربر جدید به سازمان با نقش مشخص',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/CreateUserDto' } },
          },
        },
        responses: {
          '201': {
            description: 'کاربر با موفقیت ثبت شد',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/UserDto' } } },
          },
        },
      },
    },
    '/api/users/{id}/role': {
      patch: {
        tags: ['Users & RBAC'],
        summary: 'تغییر نقش سازمانی کاربر (RBAC Role Assignment)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['role'],
                properties: {
                  role: {
                    type: 'string',
                    enum: ['employee', 'room_manager', 'org_admin', 'super_admin'],
                    example: 'room_manager',
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'نقش کاربر با موفقیت تغییر یافت' },
        },
      },
    },
    '/api/users/{id}/status': {
      patch: {
        tags: ['Users & RBAC'],
        summary: 'فعال‌سازی یا تعلیق وضعیت کاربر در سازمان',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['status'],
                properties: {
                  status: { type: 'string', enum: ['active', 'suspended', 'ACTIVE', 'SUSPENDED'], example: 'active' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'وضعیت کاربر با موفقیت بروزرسانی شد' },
        },
      },
    },
    '/api/stats': {
      get: {
        tags: ['Analytics & Stats'],
        summary: 'دریافت آمار کلی، جلسات امروز و ضریب استفاده از سالن‌ها',
        parameters: [
          { name: 'orgId', in: 'query', schema: { type: 'string' }, description: 'شناسه سازمان' },
        ],
        responses: {
          '200': {
            description: 'آمار سازمان',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/StatsDto' } },
            },
          },
        },
      },
    },
    '/api/health': {
      get: {
        tags: ['System & Health'],
        summary: 'بررسی سلامت سرویس و ارتباط پایگاه‌داده (Healthcheck)',
        responses: {
          '200': {
            description: 'سیستم سالم است',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'ok' },
                    uptime: { type: 'number' },
                    timestamp: { type: 'string' },
                    database: { type: 'string', example: 'PostgreSQL Connected' },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};
