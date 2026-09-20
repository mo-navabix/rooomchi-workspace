import { Logo, type LogoProps } from './Logo';

export type DidarBrandVariant = LogoProps['variant'];
export type DidarBrandMarkProps = LogoProps;

/** @deprecated Prefer `Logo` — kept for existing imports. */
export const DidarBrandMark = Logo;
