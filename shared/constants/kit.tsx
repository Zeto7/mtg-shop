export const mapAmount = {
    1: '1x',
    2: '2x',
    3: '3x',
} as const;

export const kitAmount = Object.entries(mapAmount).map(([name, value]) => ({name, value}));