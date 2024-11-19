
export const validateInput = (username: string, email: string, password: string): { valid: boolean, message: string } => {
  if (username && email && password) {
    // 用户名验证规则
    const usernameRegex = /^[a-zA-Z0-9!#$%+*_=\-(){}[\]|\\:;。."'<>,?/~@\-\u4e00-\u9fa5]{1,10}$/;
    if (!usernameRegex.test(username)) {
      return { valid: false, message: '用户名长度为1到10个字符。可以包含字母（大小写）、数字、下划线 _ 以及连字符 -' };
    }

     // 邮箱验证规则
     const emailRegex = /[\w!#$%&'*+/=?^_`{|}~-]+(?:\.[\w!#$%&'*+/=?^_`{|}~-]+)*@(?:[\w](?:[\w-]*[\w])?\.)+[\w](?:[\w-]*[\w])?/;

     if (!emailRegex.test(email)) {
       return { valid: false, message: '请检查邮箱格式是否正确！.' };
     }

    // 密码验证规则
    const passwordRegex = /^[a-zA-Z][\w!@#$%^&*()-.。]{5,17}$/;
    if (!passwordRegex.test(password)) {
      return { valid: false, message: '密码(以字母开头，长度在6~18之间，只能包含字母、数字和下划线)' };
    }

    return { valid: true, message: '所有字段均有效。' };
  } else {
    return { valid: false, message: '请填写完整内容' };
  }
};