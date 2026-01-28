// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import {FormattedMessage} from 'react-intl';
import {useSelector} from 'react-redux';

import {getConfig} from 'mattermost-redux/selectors/entities/general';

type Props = {
    customDescriptionText?: string;
    siteName: string | undefined;
};
const SiteNameAndDescription = ({customDescriptionText, siteName}: Props) => {
    const config = useSelector(getConfig);
    // 如果 siteName 未传入，从 getConfig 获取（通过 tsconfig.json 路径映射，会自动使用 brand_config）
    const displaySiteName = siteName || config.SiteName || 'Mattermost';

    const description = customDescriptionText || (
        <FormattedMessage
            id='web.root.signup_info'
            defaultMessage='All team communication in one place, searchable and accessible anywhere'
        />
    );

    return (
        <>
            <h1 id='site_name'>{displaySiteName}</h1>
            <h3
                id='site_description'
                className='color--light'
            >
                {description}
            </h3>
        </>
    );
};

export default React.memo(SiteNameAndDescription);
