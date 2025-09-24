'use client';

// 导入React相关依赖
import React, { Component, ReactNode } from 'react';
// 导入图标组件
import { AlertCircle, RefreshCw } from 'lucide-react';

// 组件属性接口定义 ----
interface Props {
  // 子组件，将被错误边界包裹
  children: ReactNode;
  // 可选的自定义错误回退UI
  fallback?: ReactNode;
}

// 组件状态接口定义 ----
interface State {
  // 是否发生错误
  hasError: boolean;
  // 捕获的错误对象
  error?: Error;
}

// 错误边界组件类 ----
export class ErrorBoundary extends Component<Props, State> {
  // 构造函数 ----
  constructor(props: Props) {
    super(props);
    // 初始化状态，默认没有错误
    this.state = { hasError: false };
  }

  // 静态方法：从错误中派生状态 ----
  // 当子组件抛出错误时，React会调用此方法
  static getDerivedStateFromError(error: Error): State {
    // 更新状态以触发错误UI的渲染
    return { hasError: true, error };
  }

  // 生命周期方法：捕获错误信息 ----
  // 当子组件抛出错误时，此方法会被调用
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // 在控制台记录错误详细信息，便于调试
    console.error('EPUB Reader Error:', error, errorInfo);
  }

  // 渲染方法 ----
  render() {
    // 如果发生错误，显示错误UI
    if (this.state.hasError) {
      // 如果提供了自定义回退UI，则使用它
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // 默认错误UI ----
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full mx-4">
            <div className="bg-white rounded-lg shadow-lg p-8 text-center">
              {/* 错误图标 ---- */}
              <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              
              {/* 错误标题 ---- */}
              <h1 className="text-xl font-semibold text-gray-900 mb-2">
                出现了一些问题
              </h1>
              
              {/* 错误描述 ---- */}
              <p className="text-gray-600 mb-6">
                应用程序遇到了意外错误。这可能是由于EPUB文件格式不兼容或其他技术问题造成的。
              </p>
              
              {/* 操作按钮组 ---- */}
              <div className="space-y-3">
                {/* 重新加载页面按钮 ---- */}
                <button
                  onClick={() => window.location.reload()}
                  className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  重新加载页面
                </button>
                
                {/* 返回应用按钮 ---- */}
                <button
                  onClick={() => this.setState({ hasError: false, error: undefined })}
                  className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  返回应用
                </button>
              </div>

              {/* 开发模式下的错误详情 ---- */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mt-4 text-left">
                  <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                    查看详细错误信息 (开发模式)
                  </summary>
                  <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-auto text-red-600">
                    {this.state.error.message}
                    {this.state.error.stack}
                  </pre>
                </details>
              )}
            </div>
          </div>
        </div>
      );
    }

    // 如果没有错误，正常渲染子组件
    return this.props.children;
  }
}