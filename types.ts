export enum ThemeType {
  // 多巴胺系列 (高饱和度、明亮渐变)
  DopaminePink = 'dopamine-pink',
  DopamineYellow = 'dopamine-yellow',
  DopamineBlue = 'dopamine-blue',
  DopaminePurple = 'dopamine-purple',
  DopamineOrange = 'dopamine-orange',
  
  // 马卡龙系列 (低饱和度、柔和渐变)
  MacaronMint = 'macaron-mint',
  MacaronPurple = 'macaron-purple',
  MacaronPeach = 'macaron-peach',
  MacaronSky = 'macaron-sky',
  MacaronCream = 'macaron-cream',
  
  // 中国风系列 (古典、稳重渐变)
  ChineseInk = 'chinese-ink',
  ChineseCyan = 'chinese-cyan',
  ChineseRed = 'chinese-red',
  ChineseGold = 'chinese-gold',
  ChineseJade = 'chinese-jade',
  
  // 欧美复古系列 (胶片感、怀旧渐变)
  RetroBrown = 'retro-brown',
  RetroGreen = 'retro-green',
  RetroNavy = 'retro-navy',
  RetroWine = 'retro-wine',
  RetroSlate = 'retro-slate',

  // 赛博朋克系列 (霓虹、对比渐变)
  CyberNeon = 'cyber-neon',
  CyberElectric = 'cyber-electric',
  CyberAcid = 'cyber-acid',

  // 大自然系列 (生机、自然渐变)
  NatureForest = 'nature-forest',
  NatureSunset = 'nature-sunset',
  NatureOcean = 'nature-ocean',
  NatureDesert = 'nature-desert',

  // 默认保持一个基础渐变
  OceanGradient = 'ocean-gradient'
}

export enum HobbyShape {
  Circle = 'circle',
  Square = 'square',
  Diamond = 'diamond',
  Hexagon = 'hexagon'
}

export enum AvatarFrameType {
  None = 'none',
  Wreath = 'wreath',      // 花环 (参考图2)
  Polygon = 'polygon',    // 多层多边形 (参考图3)
  Classic = 'classic',    // 经典圆环
  Playful = 'playful',    // 活泼点缀
  Crayon = 'crayon',      // 蜡笔涂鸦
  Stamp = 'stamp',        // 邮票锯齿
  PaperCut = 'papercut',  // 剪纸质感
  Cartoon = 'cartoon'     // 卡通圆角
}

export enum AvatarShape {
  Circle = 'circle',
  Square = 'square',
  Hexagon = 'hexagon',
  Shield = 'shield'
}

export interface FamilyMember {
  id: string;
  relation: string;
  name: string;
  job: string;
  phone: string;
}

export interface Award {
  id: string;
  name: string;
  date: string;
  level: string;
}

export interface ImageItem {
  id: string;
  url: string; // base64
  caption: string;
}

export interface ResumeData {
  // Global Design Config
  theme: ThemeType;
  themeColor: string; // Hex code for primary color override
  darkMode?: boolean; // Enable dark mode for the editor
  pageBackground?: string; // Global background for internal pages
  
  // Cover Page
  cover: {
    title: string; // Big Title
    subtitle: string; // Small Title (New)
    slogan: string;
    backgroundImage: string;
    showAvatar: boolean;
    avatarFrame: AvatarFrameType;
    avatarShape: AvatarShape;
  };

  // Back Cover
  backCover: {
    backgroundImage: string;
    showAvatar: boolean;
    avatarFrame: AvatarFrameType;
    avatarShape: AvatarShape;
  };

  // Page 1: Info & Quality
  basicInfo: {
    name: string;
    gender: string;
    birthday: string;
    school: string;
    avatarUrl: string;
    intendedSchool: string;
    motto?: string;
  };
  contact: {
    phone: string;
    address: string;
    email?: string;
    wechat?: string;
  };
  family: FamilyMember[];
  qualityReports: ImageItem[]; // Changed from string[] to ImageItem[] to support captions
  grades: {
    rowName: string;
    subjects: {
      name: string;
      value: string;
    }[];
  }[];
  
  // Page 2 & 3+: Awards
  awards: Award[]; // Text summary
  awardsQuote?: string; // 可自定义的寄语
  certificates: ImageItem[]; // Array of image objects with captions

  // Page: Hobbies
  hobbies: {
    content: string;
    specialties: string[]; // 特长标签，如：钢琴十级、创意编程等
    images: ImageItem[]; // Array of image objects with captions
    imageShape: HobbyShape;
  };

  // Page: Essays
  coverLetter: string; // Self introduction
  recommendationLetterImage?: string; // Optional image
  
  // 社会实践
  socialPractice: {
    content: string;
    images: ImageItem[];
  };

  // Page: Closing
  closingMessage: string; 
}

// ⚠️ 这里填入默认值。
export const INITIAL_RESUME_DATA: ResumeData = {
  theme: ThemeType.OceanGradient,
  themeColor: '#0ea5e9',
  darkMode: false,
  pageBackground: '',
  cover: {
    title: '我的简历',
    subtitle: 'PERSONAL RESUME',
    slogan: '不仅要读万卷书，更要行万里路',
    backgroundImage: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=2022&auto=format&fit=crop',
    showAvatar: true,
    avatarFrame: AvatarFrameType.Classic,
    avatarShape: AvatarShape.Circle,
  },
  backCover: {
    backgroundImage: '',
    showAvatar: true,
    avatarFrame: AvatarFrameType.Classic,
    avatarShape: AvatarShape.Circle,
  },
  basicInfo: {
    name: '张小明',
    gender: '男',
    birthday: '2012-05-20',
    school: '北京市第一实验小学',
    avatarUrl: 'https://picsum.photos/200/200',
    intendedSchool: '人大附中',
    motto: '志向高远，脚踏实地',
  },
  contact: {
    phone: '138-0000-0000',
    address: '北京市海淀区XX街道XX号',
    email: 'xiaoming@example.com',
    wechat: 'xiaoming_123',
  },
  family: [],
  qualityReports: [],
  grades: [
    { rowName: '四年级上', subjects: [{name: '语文', value: 'A'}, {name: '数学', value: 'A'}, {name: '英语', value: 'A'}, {name: '综合科目', value: 'A'}] },
    { rowName: '四年级下', subjects: [{name: '语文', value: 'A'}, {name: '数学', value: 'A'}, {name: '英语', value: 'A'}, {name: '综合科目', value: 'A'}] },
    { rowName: '五年级上', subjects: [{name: '语文', value: 'A'}, {name: '数学', value: 'A'}, {name: '英语', value: 'A'}, {name: '综合科目', value: 'A'}] },
    { rowName: '五年级下', subjects: [{name: '语文', value: 'A'}, {name: '数学', value: 'A'}, {name: '英语', value: 'A'}, {name: '综合科目', value: 'A'}] },
    { rowName: '六年级上', subjects: [{name: '语文', value: 'A'}, {name: '数学', value: 'A'}, {name: '英语', value: 'A'}, {name: '综合科目', value: 'A'}] },
  ],
  awards: [
    { id: '1', name: '全国青少年信息学奥林匹克联赛一等奖', level: '国家级', date: '2023' },
    { id: '2', name: '海淀区三好学生', level: '区级', date: '2022' },
    { id: '3', name: '北京市中小学电脑制作活动一等奖', level: '市级', date: '2023' },
    { id: '4', name: '“希望杯”全国数学邀请赛一等奖', level: '国家级', date: '2022' },
    { id: '5', name: '学校“优秀少先队员”称号', level: '校级', date: '2023' },
    { id: '6', name: '剑桥少儿英语三级优秀证书', level: '国际', date: '2021' },
    { id: '7', name: '“春蕾杯”全国小学生作文大赛一等奖', level: '国家级', date: '2022' },
    { id: '8', name: '学校运动会 100米跑第一名', level: '校级', date: '2023' },
  ],
  awardsQuote: '每一份荣誉都是汗水的结晶',
  certificates: [],
  hobbies: {
    content: '热爱编程，能够使用 Python 编写简单的小游戏。利用暑假时间参加了博物馆志愿讲解员活动，累计服务时长 30 小时。同时也喜欢篮球和游泳。',
    specialties: ['创意编程', '博物馆讲解员', '钢琴七级'],
    images: [],
    imageShape: HobbyShape.Circle,
  },
  coverLetter: '我是一个性格开朗、热爱学习的阳光少年。在学校里，我尊敬师长，团结同学，成绩优异。我不仅在学习上刻苦钻研，还广泛涉猎课外知识。我对数学和编程有着浓厚的兴趣，希望能进入贵校继续深造，在更广阔的舞台上展示自己，成为一名全面发展的优秀中学生。',
  socialPractice: {
    content: '',
    images: []
  },
  closingMessage: '感谢您在百忙之中阅读我的简历。我相信，每一个结束都是新的开始，我已准备好迎接初中生活的挑战！',
};