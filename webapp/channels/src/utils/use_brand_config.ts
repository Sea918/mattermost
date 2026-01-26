// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

/**
 * 品牌配置 Hook
 *
 * 提供便捷的方式获取品牌配置
 *
 * 使用示例：
 * const {siteName, siteURL, defaultTheme} = useBrandConfig();
 */

import {useSelector} from 'react-redux';
import type {GlobalState} from '@mattermost/types/store';

import {getConfigWithBrand} from './config_with_brand';

export function useBrandConfig() {
    const config = useSelector((state: GlobalState) => getConfigWithBrand(state));

    return {
        // 网站名称
        siteName: config.SiteName || 'Mattermost',

        // 网站 URL
        siteURL: config.SiteURL || '',

        // 自定义品牌文本
        customBrandText: config.CustomBrandText || '',

        // 自定义描述文本
        customDescriptionText: config.CustomDescriptionText || '',

        // 是否启用自定义品牌
        enableCustomBrand: config.EnableCustomBrand === 'true',

        // 默认主题
        defaultTheme: config.DefaultTheme || 'denim',

        // 是否启用主题选择
        enableThemeSelection: config.EnableThemeSelection === 'true',

        // 是否允许自定义主题
        allowCustomThemes: config.AllowCustomThemes === 'true',

        // 原始配置对象（如果需要访问其他配置项）
        config,
    };
}
