// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import {useIntl} from 'react-intl';

export default function MattermostLogo(props: React.HTMLAttributes<HTMLSpanElement>) {
    const {formatMessage} = useIntl();
    return (
        <span {...props}>
            <svg
                width='40'
                height='36'
                viewBox='0 0 40 36'
                fill='none'
                xmlns='http://www.w3.org/2000/svg'
                xmlnsXlink='http://www.w3.org/1999/xlink'
                role='img'
                aria-label={formatMessage({id: 'generic_icons.mattermost', defaultMessage: 'Mattermost Logo'})}
            >
                <rect
                    width='40'
                    height='36'
                    fill='url(#pattern0_737_2820)'
                />
                <defs>
                    <pattern
                        id='pattern0_737_2820'
                        patternContentUnits='objectBoundingBox'
                        width='1'
                        height='1'
                    >
                        <use
                            xlinkHref='#image0_737_2820'
                            transform='matrix(0.00900901 0 0 0.01001 0 -0.00550551)'
                        />
                    </pattern>
                    <image
                        id='image0_737_2820'
                        width='111'
                        height='101'
                        preserveAspectRatio='none'
                        xlinkHref='data:image/png;base64,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'
                    />
                </defs>
            </svg>
        </span>
    );
}