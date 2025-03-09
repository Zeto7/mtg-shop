export const mapAmount = {
    1: '1x',
    2: '2x',
    3: '3x',
} as const;

export const kitAmount = Object.entries(mapAmount).map(([value , name ]) => ({name, value}));

export type KitAmount = keyof typeof kitAmount;    