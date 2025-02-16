import { Role} from "../model";

const defaultRoles = [
  { name:'superAdmin', permissions: ["All"] },
  { name:'webMaster', permissions: [] },
  { name:'user', permissions: [] },
];

// 初始化角色
export const initializeRoles = async () => {
  try {
    // 直接检查是否已有角色数据
    const RoleCount = await Role.countDocuments();

    if (RoleCount > 0) {
      console.log("数据已存在，跳过初始化");
      return;
    }
    console.log('程序首次运行，初始化数据');
    
    // 没有数据，插入默认数据
    await Role.insertMany(defaultRoles);

  } catch (error) {
    console.error("初始化角色失败:", error);
  }
};
