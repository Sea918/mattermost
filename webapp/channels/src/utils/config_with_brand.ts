// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

/**
 * 带品牌配置的 getConfig 包装器
 *
 * 这个文件提供了 getConfigWithBrand() 函数，它会合并前端品牌配置和后端配置
 * 前端配置优先于后端配置
 *
 * 使用方法：
 * 1. 将 import {getConfig} from 'mattermost-redux/selectors/entities/general'
 *    改为 import {getConfigWithBrand as getConfig} from 'utils/config_with_brand'
 * 2. 其他代码无需修改
 */

import type {ClientConfig} from '@mattermost/types/config';
import type {GlobalState} from '@mattermost/types/store';

// 使用相对路径导入，避免路径别名导致的循环引用
// 导入所有原始导出，然后覆盖 getConfig
import * as originalGeneralSelectors from '../packages/mattermost-redux/src/selectors/entities/general';
import {getConfig as getOriginalConfig} from '../packages/mattermost-redux/src/selectors/entities/general';

import {BRAND_CONFIG} from './brand_config';

/**
 * 获取合并后的配置（前端品牌配置优先）
 *
 * 这个函数会：
 * 1. 获取后端配置
 * 2. 用前端品牌配置覆盖相应的字段
 * 3. 返回合并后的配置
 *
 * @param state Redux state
 * @returns 合并后的配置对象
 */
export function getConfigWithBrand(state: GlobalState): Partial<ClientConfig> {
    // 获取后端配置
    const backendConfig = getOriginalConfig(state);

    // 创建配置副本，避免直接修改原配置
    const mergedConfig: Partial<ClientConfig> = {
        ...backendConfig,
    };

    // ========== 品牌配置覆盖 ==========

    // ========== 品牌配置覆盖（前端配置优先）==========

    // 网站名称
    if (BRAND_CONFIG.ENABLE_CUSTOM_BRAND && BRAND_CONFIG.SITE_NAME) {
        mergedConfig.SiteName = BRAND_CONFIG.SITE_NAME;
    }

    // 网站 URL
    if (BRAND_CONFIG.ENABLE_CUSTOM_BRAND && BRAND_CONFIG.SITE_URL) {
        mergedConfig.SiteURL = BRAND_CONFIG.SITE_URL;
    }

    // 自定义品牌文本
    if (BRAND_CONFIG.ENABLE_CUSTOM_BRAND && BRAND_CONFIG.CUSTOM_BRAND_TEXT) {
        mergedConfig.CustomBrandText = BRAND_CONFIG.CUSTOM_BRAND_TEXT;
        mergedConfig.EnableCustomBrand = 'true';
    }

    // 自定义描述文本
    if (BRAND_CONFIG.ENABLE_CUSTOM_BRAND && BRAND_CONFIG.CUSTOM_DESCRIPTION_TEXT) {
        mergedConfig.CustomDescriptionText = BRAND_CONFIG.CUSTOM_DESCRIPTION_TEXT;
    }

    // 默认主题（始终使用前端配置，如果设置了的话）
    if (BRAND_CONFIG.DEFAULT_THEME) {
        mergedConfig.DefaultTheme = BRAND_CONFIG.DEFAULT_THEME;
    }

    // 主题选择（始终使用前端配置，如果设置了的话）
    if (BRAND_CONFIG.ENABLE_THEME_SELECTION !== undefined) {
        mergedConfig.EnableThemeSelection = BRAND_CONFIG.ENABLE_THEME_SELECTION ? 'true' : 'false';
    }

    // 允许自定义主题（始终使用前端配置，如果设置了的话）
    if (BRAND_CONFIG.ALLOW_CUSTOM_THEMES !== undefined) {
        mergedConfig.AllowCustomThemes = BRAND_CONFIG.ALLOW_CUSTOM_THEMES ? 'true' : 'false';
    }

    return mergedConfig;
}

/**
 * 导出为 getConfig，覆盖原始版本
 * 使用方式：
 * import {getConfig, getLicense, isCompatibleWithJoinViewTeamPermissions, ...} from 'mattermost-redux/selectors/entities/general'
 */
export const getConfig = getConfigWithBrand;

/**
 * 重新导出原始模块的所有其他导出（除了 getConfig）
 * 这样其他文件可以正常导入 isCompatibleWithJoinViewTeamPermissions 等函数
 */
export const {
    getLicense,
    getFeatureFlagValue,
    getPasswordConfig,
    isCloudLicense,
    isCompatibleWithJoinViewTeamPermissions,
    canUploadFilesOnMobile,
    canDownloadFilesOnMobile,
    getAutolinkedUrlSchemes,
    getManagedResourcePaths,
    getServerVersion,
    getFirstAdminVisitMarketplaceStatus,
    getFirstAdminSetupComplete,
    isPerformanceDebuggingEnabled,
    isMarketplaceEnabled,
    getUsersStatusAndProfileFetchingPollInterval,
    developerModeEnabled,
    testingEnabled,
    getCustomProfileAttributes,
    getIsCrossTeamSearchEnabled,
    getCWSAvailability,
} = originalGeneralSelectors;

// 重新导出类型
export type {PasswordConfig} from '../packages/mattermost-redux/src/selectors/entities/general';

/**
 * 获取原始后端配置（不包含品牌覆盖）
 * 如果需要访问原始后端配置，可以使用这个函数
 */
export function getOriginalConfigWithoutBrand(state: GlobalState): Partial<ClientConfig> {
    return getOriginalConfig(state);
}
