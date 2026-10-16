"use client";
import { useParams } from "next/navigation";
import { SharedProjectInventoryPage } from "@/features/inventory";

export default function SalesExecProjectInventoryPage() {
  const params = useParams();
  const projectId = params.projectId as string;

  return (
    <SharedProjectInventoryPage
      projectId={projectId}
      backLink="/dashboard/sales-executive/inventory"
      title="Live Inventory"
      canManageTowers={false}
      canBookUnits={true}
      canSetPossession={false}
    />
  );
}
