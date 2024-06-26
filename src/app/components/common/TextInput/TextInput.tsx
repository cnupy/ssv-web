import Grid from '@mui/material/Grid';
import React, { useState } from 'react';
import { useStyles } from './TextInput.styles';
import InputSideButton from '~app/components/common/Button/InputSideButton/InputSideButton';

type InputProps = {
    icon?: any,
    value?: any,
    sideIcon?: any,
    disable?: boolean,
    sideText?: string,
    withLock?: boolean,
    showError?: boolean,
    dataTestId?: string,
    placeHolder?: string,
    onBlurCallBack?: any,
    extendClass?: string,
    wrapperClass?: string,
    withSideText?: boolean,
    onFocusCallback?: any,
    onPasteCallback?: any,
    onChangeCallback?: any,
    extendInputClass?: string,
    isTextArea?: boolean,
    sideButton?: boolean,
    sideButtonClicked?: boolean,
    sideButtonLabel?: string,
    sideButtonAction?: Function,
    sideButtonDisabled?: boolean,
};

const TextInput = ({ icon,
                     value,
                     disable,
                     sideIcon,
                     sideText,
                     withLock,
                     showError,
                     dataTestId,
                     extendClass,
                     placeHolder,
                     wrapperClass,
                     withSideText,
                     onFocusCallback,
                     onBlurCallBack,
                     onChangeCallback,
                     onPasteCallback,
                     extendInputClass,
                     sideButtonAction,
                     sideButtonLabel,
                       sideButtonClicked,
                     sideButton,
                     isTextArea,
                     sideButtonDisabled,
                   ...params }: InputProps) => {
    const classes = useStyles({ showError, disable, isTextArea });
    const [password, showPassword] = useState(false);
    const onChangeWrapper = (e: any) => {
        const inputValue = e.target.value;
        if (inputValue.length >= 614) return;
        onChangeCallback(e);
        // @ts-ignore
        if (params?.inputProps?.onChange) params.inputProps?.onChange(e);

    };

    return (
      <Grid container
          // @ts-ignore
        justifyContent={withLock && 'space-between'}
        className={wrapperClass ?? `${classes.Wrapper} ${extendClass}`}>
        {withLock && <Grid item className={`${classes.Lock} ${disable ? classes.LockDisable : ''}`} onClick={() => { !disable && showPassword(!password); }} />}
        <Grid item xs>
            {isTextArea ? <textarea
                rows={2}
                    value={value}
                    maxLength={614}
                    disabled={disable}
                    onBlur={onBlurCallBack}
                    data-testid={dataTestId}
                    className={`${classes.Input} ${extendInputClass}`}
                    onChange={onChangeWrapper}
                    placeholder={placeHolder ?? ''}
                /> :
            <input
                {...params}
                value={value}
                maxLength={614}
                disabled={disable}
                onFocus={onFocusCallback}
                onPaste={onPasteCallback}
                onBlur={onBlurCallBack}
                data-testid={dataTestId}
                className={`${classes.Input} ${extendInputClass}`}
                onChange={onChangeWrapper}
                placeholder={placeHolder ?? ''}
                type={(!withLock || password) ? 'text' : 'password'}
        />
            }
        </Grid>
          {sideButton &&  (
              <InputSideButton confirmedState={sideButtonClicked} sideButtonAction={sideButtonAction} disabled={sideButtonDisabled} sideButtonLabel={sideButtonLabel ?? 'Confirm'}/>
          )}
          {withSideText && (
              <Grid item className={classes.Text}>
                  {sideIcon ?? sideText ?? 'SSV'}
              </Grid>
          )}
          {icon && (
              <Grid item className={classes.Icon}>
                  {icon}
              </Grid>
          )}
      </Grid>
    );
};

export default TextInput;
