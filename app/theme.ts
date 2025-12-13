import { createTheme, rem } from '@mantine/core';

export const theme = createTheme({
    primaryColor: 'navy',
    fontFamily: '"Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, "system-ui", Roboto, "Helvetica Neue", "Segoe UI", "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", sans-serif',

    colors: {
        // Financial Standard Colors (Korean Market)
        profit: [
            '#ffebeb',
            '#ffc9c9',
            '#ffa8a8',
            '#ff8787',
            '#ff6b6b',
            '#fa5252',
            '#f03e3e',
            '#e54545', // 7: Profit / Up (Standard Red)
            '#c92a2a',
            '#a61e4d',
        ],
        expense: [
            '#e7f5ff',
            '#d0ebff',
            '#a5d8ff',
            '#74c0fc',
            '#4dabf7',
            '#339af0',
            '#3182f6', // 6: Expense / Down (Expense Blue)
            '#1c7ed6',
            '#1971c2',
            '#1864ab',
        ],
        // Blue Accents (for Links/Interactive Elements)
        brandBlue: [
            '#eff6ff',
            '#dbeafe',
            '#bfdbfe',
            '#93c5fd',
            '#60a5fa',
            '#3b82f6', // 5 (Standard Blue)
            '#2563eb',
            '#1d4ed8',
            '#1e40af',
            '#1e3a8a',
        ],
        // Trust Navy (Structure / Hero)
        navy: [
            '#f1f3f5',
            '#e9ecef', // 1: Hover backgrounds
            '#dee2e6', // 2: Weak Border
            '#ced4da',
            '#adb5bd',
            '#868e96',
            '#495057',
            '#343a40',
            '#1b2136', // 8: Hero Card Background / Dark Primary
            '#14192a',
        ],
        // Cool Greys (Text / UI)
        gray: [
            '#f8f9fa',
            '#f2f4f6', // 1: App Background
            '#e5e8eb', // 2: Strong Border
            '#d1d6db',
            '#b0b8c1',
            '#8b95a1', // 5: Secondary Text
            '#5f6b7c',
            '#374151',
            '#191f28', // 8: Primary Text
            '#111620',
        ],
    },

    shadows: {
        xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
        md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
        lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
    },

    headings: {
        fontFamily: 'Pretendard Variable, sans-serif',
        fontWeight: '700',
    },

    components: {
        Card: {
            defaultProps: {
                shadow: 'xs',
                radius: 'md',
                padding: 'lg',
                withBorder: true,
                bg: '#1F2937', // Dark Surface
                c: 'white'
            },
            styles: {
                root: {
                    borderColor: '#374151', // Dark Border
                }
            }
        },
        Paper: {
            defaultProps: {
                shadow: 'xs',
                radius: 'md',
                p: 'lg',
                withBorder: true,
                bg: '#1F2937', // Dark Surface
                c: 'white'
            },
            styles: {
                root: {
                    borderColor: '#374151', // Dark Border
                }
            }
        },
        Button: {
            defaultProps: {
                radius: 'md',
                fw: 600,
                size: 'sm', // B2B usually uses slightly smaller, more compact buttons
            },
        },
        TextInput: {
            defaultProps: {
                radius: 'md',
                size: 'sm',
            },
            styles: {
                input: {
                    backgroundColor: '#1F2937',
                    color: 'white',
                    borderColor: '#374151',
                    fontVariantNumeric: 'tabular-nums',
                }
            }
        },
        NumberInput: {
            defaultProps: {
                radius: 'md',
                size: 'sm',
            },
            styles: {
                input: {
                    backgroundColor: '#1F2937',
                    color: 'white',
                    borderColor: '#374151',
                    fontVariantNumeric: 'tabular-nums',
                }
            }
        },
        DateInput: {
            defaultProps: {
                radius: 'md',
                size: 'sm',
            },
            styles: {
                input: {
                    backgroundColor: '#1F2937',
                    color: 'white',
                    borderColor: '#374151',
                }
            }
        },
        Select: {
            defaultProps: {
                checkIconPosition: 'right',
            },
            styles: {
                dropdown: {
                    backgroundColor: '#1F2937',
                    borderColor: '#374151',
                    color: 'white',
                },
                option: {
                    color: 'white',
                    // Removed unsupported nested selectors causing console errors
                },
                input: {
                    backgroundColor: '#1F2937',
                    color: 'white',
                    borderColor: '#374151',
                }
            }
        },
        Badge: {
            defaultProps: {
                radius: 'sm',
                fw: 600,
                variant: 'light',
            }
        },
    },
});
