/// <reference types="vitest" />
import '@testing-library/jest-dom';

interface CustomMatchers<R = unknown> {
  toBeInTheDocument(): R;
  toHaveAttribute(attr: string, value?: string): R;
  toBeVisible(): R;
  toBeDisabled(): R;
  toBeEnabled(): R;
  toBeChecked(): R;
  toBePartiallyChecked(): R;
  toHaveClass(...classNames: string[]): R;
  toHaveFocus(): R;
  toHaveTextContent(text: string | RegExp): R;
  toHaveValue(value: string | string[] | number): R;
  toBeRequired(): R;
  toBeValid(): R;
  toBeInvalid(): R;
  toBeEmptyDOMElement(): R;
  toHaveStyle(css: string | Record<string, string>): R;
  toContainElement(element: HTMLElement | null): R;
  toContainHTML(htmlText: string): R;
}

declare global {
  namespace Vi {
    interface Assertion extends CustomMatchers {}
    interface AsymmetricMatchersContaining extends CustomMatchers {}
  }
}
