export function customStringify(obj) {
    function replaceUndefined(value) {
      if (Array.isArray(value)) {
        return value.map(replaceUndefined);
      } else if (value instanceof Date) {
        // 如果是 Date 类型，转换为 ISO 字符串
        return value.toISOString();
      } else if (value !== null && typeof value === "object") {
        return Object.fromEntries(
          Object.entries(value).map(([key, val]) => {
            if (key === "_id" || key === "parentFolder") {
              // 对 _id 和 parentFolder 转换为字符串
              return [key, val ? val.toString() : val];
            }
            // 保留其他字段，处理 undefined 为 null
            return [key, val === undefined ? null : replaceUndefined(val)];
          })
        );
      }
      return value;
    }
  
    return JSON.stringify(replaceUndefined(obj));
  }