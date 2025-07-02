import React from 'react';

interface AIResponseProps {
	response: string;
	onDismiss?: () => void;
}

export default function AIResponse({ response, onDismiss }: AIResponseProps) {
	return (
		<div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg shadow-sm">
			<div className="flex items-start justify-between">
				<div className="flex items-start space-x-3 flex-1">
					<div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
						<svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
						</svg>
					</div>
					<div className="flex-1">
						<h3 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
							<span>AI Response</span>
							<span className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">New</span>
						</h3>
						<div className="text-sm text-gray-700 leading-relaxed">
							{response}
						</div>
					</div>
				</div>
				
				{onDismiss && (
					<button
						onClick={onDismiss}
						className="ml-3 flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
						title="Dismiss"
					>
						<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				)}
			</div>
			
			{/* Action buttons */}
			<div className="mt-3 pt-3 border-t border-blue-200 flex justify-end space-x-2">
				<button className="px-3 py-1 text-xs text-blue-600 hover:text-blue-700 transition-colors">
					Copy
				</button>
				<button className="px-3 py-1 text-xs text-blue-600 hover:text-blue-700 transition-colors">
					Ask Follow-up
				</button>
			</div>
		</div>
	);
} 