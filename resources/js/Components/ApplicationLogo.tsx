import React, { SVGProps } from 'react';

interface ApplicationLogoProps extends SVGProps<SVGSVGElement> {
  size?: number | string;
  color?: string;
}

const ApplicationLogo: React.FC<ApplicationLogoProps> = ({
  size = 48,
  color = 'currentColor',
  ...props
}) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 200 200" {...props}>
    <defs>
      <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#4CAF50" stopOpacity={1} />
        <stop offset="100%" stopColor="#2196F3" stopOpacity={1} />
      </linearGradient>
    </defs>
    <circle cx="100" cy="100" r="90" fill={color} />

    {/* Message bubble */}
    <path d="M40 70 Q40 50 60 50 L140 50 Q160 50 160 70 L160 130 Q160 150 140 150 L110 150 L100 170 L90 150 L60 150 Q40 150 40 130 Z" fill="white" />

    {/* Game Controller */}
    <path d="M65 95 H135 Q145 95 145 105 V125 Q145 135 135 135 H65 Q55 135 55 125 V105 Q55 95 65 95 Z" fill={color} />
    <circle cx="75" cy="115" r="8" fill="white" />
    <circle cx="125" cy="115" r="8" fill="white" />

    <text x="56" y="88" fontFamily="Arial, sans-serif" fontSize="40" fontWeight="bold" fill={color}>A</text>
    <text x="85" y="88" fontFamily="Arial, sans-serif" fontSize="40" fontWeight="bold" fill={color}>B</text>
    <text x="114" y="88" fontFamily="Arial, sans-serif" fontSize="40" fontWeight="bold" fill={color}>C</text>
  </svg>
);

export default ApplicationLogo;
