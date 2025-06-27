<script setup lang="tsx">
import type { VbenFormSchema } from '@vben/common-ui';

import { computed, ref } from 'vue';
import { message } from 'ant-design-vue';

import { AuthenticationRegister, z } from '@vben/common-ui';
import { registerApi, sendVerificationCodeApi } from '#/api';

defineOptions({ name: 'Register' });

const loading = ref(false);
const emailCodeLoading = ref(false);
const countdown = ref(0);

// 发送邮箱验证码
const sendEmailCode = async (email: string) => {
  if (!email) {
    message.error('请先输入邮箱地址');
    return;
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    message.error('邮箱格式不正确');
    return;
  }
  
  try {
    emailCodeLoading.value = true;
    await sendVerificationCodeApi({ email, type: 1 });
    message.success('验证码已发送到您的邮箱');
    
    // 开始倒计时
    countdown.value = 60;
    const timer = setInterval(() => {
      countdown.value--;
      if (countdown.value <= 0) {
        clearInterval(timer);
      }
    }, 1000);
  } catch (error) {
    message.error('发送验证码失败，请稍后重试');
  } finally {
    emailCodeLoading.value = false;
  }
};

// 注册处理
const handleRegister = async (values: any) => {
  if (values.password !== values.confirmPassword) {
    message.error('两次输入的密码不一致');
    return;
  }
  
  try {
    loading.value = true;
    const response = await registerApi({
      name: values.username,
      email: values.email,
      password: values.password,
      code: values.code
    });
    
    message.success('注册成功！请登录');
    // 可以在这里跳转到登录页面
    // router.push('/login');
  } catch (error: any) {
    const errorMsg = error?.response?.data?.message || '注册失败，请稍后重试';
    message.error(errorMsg);
  } finally {
    loading.value = false;
  }
};

const formSchema = computed((): VbenFormSchema[] => {
  return [
    {
      component: 'VbenInput',
      componentProps: {
        placeholder: '请输入用户名',
      },
      fieldName: 'username',
      label: '用户名',
      rules: z.string().min(1, { message: '请输入用户名' }),
    },
    {
      component: 'VbenInput',
      componentProps: {
        placeholder: '请输入邮箱地址',
        type: 'email',
      },
      fieldName: 'email',
      label: '邮箱',
      rules: z.string().email({ message: '请输入正确的邮箱地址' }),
    },
    {
      component: 'VbenInputPassword',
      componentProps: {
        placeholder: '请输入密码（至少6位）',
        passwordStrength: true,
      },
      fieldName: 'password',
      label: '密码',
      rules: z.string().min(6, { message: '密码长度至少为6位' }),
    },
    {
      component: 'VbenInputPassword',
      componentProps: {
        placeholder: '请再次输入密码',
      },
      fieldName: 'confirmPassword',
      label: '确认密码',
      dependencies: {
        rules(values) {
          const { password } = values;
          return z
            .string({ required_error: '请再次输入密码' })
            .min(6, { message: '密码长度至少为6位' })
            .refine((value) => value === password, {
              message: '两次输入的密码不一致',
            });
        },
        triggerFields: ['password'],
      },
      rules: z.string().min(6, { message: '请再次输入密码' }),
    },
    {
      component: 'VbenInput',
      componentProps: {
        placeholder: '请输入邮箱验证码',
        suffix: () => {
          return (
            <button
              type="button"
              class={[
                'px-3 py-1 text-sm rounded border',
                'transition-colors duration-200',
                emailCodeLoading.value || countdown.value > 0
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200'
                  : 'bg-blue-500 text-white hover:bg-blue-600 border-blue-500'
              ]}
              disabled={emailCodeLoading.value || countdown.value > 0}
              onClick={() => {
                // 获取当前表单中的邮箱值
                const formElement = document.querySelector('form');
                const emailInput = formElement?.querySelector('input[name="email"]') as HTMLInputElement;
                sendEmailCode(emailInput?.value || '');
              }}
            >
              {countdown.value > 0 
                ? `${countdown.value}s` 
                : emailCodeLoading.value 
                  ? '发送中...' 
                  : '获取验证码'
              }
            </button>
          );
        },
      },
      fieldName: 'code',
      label: '验证码',
      rules: z.string().min(1, { message: '请输入验证码' }),
    },
  ];
});
</script>

<template>
  <AuthenticationRegister
    :form-schema="formSchema"
    :loading="loading"
    @submit="handleRegister"
  />
</template>
