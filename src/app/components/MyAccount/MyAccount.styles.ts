import { makeStyles } from '@material-ui/core/styles';
import screenSizes from '~lib/utils/screenSizes';

export const useStyles = makeStyles((theme) => ({
    Wrapper: {
        width: '95%',
        margin: 'auto',
        [screenSizes.lg]: {
            width: 728,
        },
        maxWidth: 1200,
        marginTop: '40px',
        padding: theme.spacing(3, 3, 3, 3),
    },
    Header: {
        marginBottom: '20px',
    },
    HeaderText: {
        fontSize: 28,
        fontWeight: 800,
        lineHeight: 1.24,
        fontStyle: 'normal',
        letterSpacing: -0.5,
        fontStretch: 'normal',
        color: theme.colors.black,
    },
    Liquidated: {
        height: '32px',
        fontWeight: 600,
        fontSize: '16px',
        lineHeight: 1.13,
        color: '#ec1c26',
        marginLeft: '20px',
        padding: '7px 12px',
        backgroundColor: '#fde4e5',
    },
    AddButton: {
        width: 100,
        height: 36,
        border: 'none',
        float: 'right',
        borderRadius: 8,
        cursor: 'pointer',
        textDecoration: 'none',
        backgroundColor: theme.colors.tint90,
    },
    MyBalanceWrapper: {
        [screenSizes.xl]: {
            marginRight: theme.spacing(6),
        },
    },
    AddButtonText: {
        fontSize: 16,
        fontWeight: 600,
        lineHeight: 1.25,
        textAlign: 'center',
        color: theme.colors.primaryBlue,
    },
    AddButtonDropDown: {
        top: 12,
        width: 272,
        right: 120,
        height: 152,
        borderRadius: 16,
        position: 'relative',
        padding: theme.spacing(4),
        zIndex: theme.opacity.highPriority,
        backgroundColor: theme.colors.white,
        border: `solid 1px ${theme.colors.gray10}`,
        boxShadow: theme.darkMode ? '0 12px 40px 0 rgba(253, 254, 254, 0.12)' : '0 12px 40px 0 rgba(1, 22, 39, 0.12)',
    },
    AddButtonDropDownItem: {
        fontSize: 16,
        fontWeight: 600,
        borderRadius: 8,
        lineHeight: 1.25,
        cursor: 'pointer',
        textAlign: 'left',
        margin: '0.5px 0 0',
        color: theme.colors.gray90,
        padding: theme.spacing(4, 6),
        '&:hover': {
            backgroundColor: theme.colors.gray20,
        },
    },
    Disable: {
        cursor: 'not-allowed',
        color: 'rgba(161, 172, 190, 0.5)',
        backgroundColor: 'rgba(220, 224, 232, 0.25)',
    },
    TablesWrapper: {
        width: 728,
        float: 'right',
    },
}));
