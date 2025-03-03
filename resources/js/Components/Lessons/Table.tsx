import React from "react";
import { ReactNode } from "react";

interface TableProps {
	children: ReactNode;
}

const Table: React.FC<TableProps> = ({ children }) => {
	return (
		<div className="overflow-x-auto shadow-lg my-4">
			<table className="table min-w-full text-left border-collapse bg-gradient-to-b from-blue-500 to-blue-600 dark:from-blue-800 dark:to-blue-900 rounded-lg">{children}</table>
		</div>
	);
};

export default Table;
