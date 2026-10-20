"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { STATUS_LABELS, type Project, type ProjectStatus } from "@/types/project";

interface ProjectsTableProps {
  projects: Project[];
}

type FilterValue = ProjectStatus | "all";

export function ProjectsTable({ projects }: ProjectsTableProps) {
  const [filter, setFilter] = useState<FilterValue>("all");

  const filtered = useMemo(
    () => (filter === "all" ? projects : projects.filter((p) => p.status === filter)),
    [projects, filter],
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {filtered.length} {filtered.length === 1 ? "projekt" : "projektů"}
        </p>
        <Select value={filter} onValueChange={(v) => setFilter(v as FilterValue)}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtrovat podle stavu" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Všechny stavy</SelectItem>
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Klient</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Stav</TableHead>
              <TableHead>Vytvořeno</TableHead>
              <TableHead className="text-right">Odkaz</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  Žádné projekty.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((project) => (
                <TableRow key={project.id}>
                  <TableCell className="font-medium">
                    <Link
                      href={`/admin/projects/${project.id}`}
                      className="hover:underline"
                    >
                      {project.client_name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {project.client_email}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={project.status} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(project.created_at).toLocaleDateString("cs-CZ")}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link
                      href={`/view/${project.slug}`}
                      target="_blank"
                      className="text-sm text-primary hover:underline"
                    >
                      /view/{project.slug}
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
