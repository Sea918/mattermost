// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

/**
 * 品牌配置中心
 *
 * 集中管理所有品牌相关的配置，便于统一修改和维护
 *
 * 使用方法：
 * 1. 修改下面的配置值
 * 2. 使用 getConfigWithBrand() 替代原来的 getConfig()
 * 3. 前端配置会优先于后端配置
 */

// ========== 品牌配置 ==========
export const BRAND_CONFIG = {

  // ========== 公司信息 ==========
  /**
   * 网站名称 - 显示在登录页、页面标题等位置
   * 如果设置为空字符串，将使用后端配置
   */
  SITE_NAME: 'Guduu OS',
  SITE_NAME_SHORT: 'Guduu OS',

  /**
   * 公司域名 - 用于生成链接等
   * 注意：这里应该配置前端域名（通过 Nginx 代理），而不是后端 API 地址
   * 这样所有请求都会走同源，避免 CORS 问题
   */
  COMPANY_DOMAIN: 'https://im.guduu.co',

  /**
   * 网站完整 URL - 用于生成链接、邮件等
   * 注意：这里应该配置前端域名（通过 Nginx 代理），而不是后端 API 地址
   * 这样 WebSocket、PDF 预览等都会走同源，避免 CORS 问题
   * 如果设置为空字符串，将使用后端配置
   */
  SITE_URL: 'https://im.guduu.co',

  // ========== 品牌文本 ==========
  /**
   * 自定义品牌文本 - 显示在登录页面的品牌文本（支持 Markdown）
   * 如果设置为空字符串，将使用后端配置
   */
  CUSTOM_BRAND_TEXT: '',

  /**
   * 自定义描述文本 - 显示在登录表单上方的描述
   * 如果设置为空字符串，将使用后端配置
   */
  CUSTOM_DESCRIPTION_TEXT: 'Login',

  /**
   * 是否启用自定义品牌
   * true: 使用前端配置
   * false: 使用后端配置
   */
  ENABLE_CUSTOM_BRAND: true,

  // ========== 主题配置 ==========
  /**
   * 默认主题
   * 可选值：denim | sapphire | quartz | indigo | onyx
   * 如果设置为空字符串，将使用后端配置
   */
  DEFAULT_THEME: 'quartz',

  /**
   * 是否启用主题选择
   * true: 允许用户选择主题
   * false: 使用后端配置
   */
  ENABLE_THEME_SELECTION: true,

  /**
   * 是否允许自定义主题
   * true: 允许用户创建自定义主题
   * false: 使用后端配置
   */
  ALLOW_CUSTOM_THEMES: true,

  // ========== Logo 配置 ==========
  // Logo 文件路径（相对于 src/images/）
  LOGO: {
    MAIN: 'logo.png',
    EMAIL: 'logo-email.png',
    EMAIL_DARK: 'logo_email_dark.png',
    EMAIL_BLUE: 'logo_email_blue.png',
    EMAIL_GRAY: 'logo_email_gray.png',
    WHITE: 'logoWhite.png',
  },

  // ========== 网站链接 ==========
  LINKS: {

    // 主网站
    MAIN: 'https://yourcompany.com/',

    // 文档
    DOCS: 'https://docs.yourcompany.com',

    // 关于链接
    TERMS_OF_SERVICE: 'https://yourcompany.com/terms-of-use/',
    PRIVACY_POLICY: 'https://yourcompany.com/privacy-policy/',

    // 云服务相关
    BILLING_DOCS: 'https://docs.yourcompany.com/cloud-billing',
    PRICING: 'https://yourcompany.com/pricing/',
    DEPLOYMENT_OPTIONS: 'https://yourcompany.com/deploy/',
    CLOUD_SIGNUP: 'https://yourcompany.com/sign-up/',

    // 开发者相关
    DEVELOPER_DOCS: 'https://docs.yourcompany.com/developer',
    PLUGINS: 'https://yourcompany.com/plugins',

    // 许可证相关
    CONTACT_SALES: 'https://yourcompany.com/contact-sales/',
    TRIAL_INFO: 'https://yourcompany.com/trial',
  },

  // ========== 其他配置 ==========
  META: {

    // 页面标题后缀
    TITLE_SUFFIX: ' - Guduu IM',

    // 默认描述
    DESCRIPTION: 'Guduu IM',
  },
} as const;

// 导出类型
export type BrandConfig = typeof BRAND_CONFIG;
