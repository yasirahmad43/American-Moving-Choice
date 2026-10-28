/**
 * @amc/ui: shared components for both apps. Server-safe unless marked client (RadioCardGroup,
 * Dialog and Tabs carry "use client" in their own files). Styles come from theme.css.
 */
export { cx, type ClassValue } from "./cx";
export { DEFAULT_TIME_ZONE, formatAbsoluteDate, formatMoney, isoDateTime, toDate } from "./format";
export * from "./icons";
export { Alert, type AlertProps, type AlertTone } from "./components/alert";
export {
  Badge,
  COMPANY_STATUS_LABELS,
  Chip,
  CompanyStatusPill,
  DemoChip,
  StatusPill,
  type BadgeProps,
  type BadgeVariant,
  type ChipProps,
  type ChipTone,
  type CompanyStatusValue,
  type StatusPillProps,
  type StatusTone,
} from "./components/badge";
export { Button, LinkButton, buttonClasses, type ButtonProps, type ButtonSize, type ButtonVariant, type LinkButtonProps } from "./components/button";
export { Card, type CardProps } from "./components/card";
export { CredentialRow, type CredentialRowProps, type CredentialStatus } from "./components/credential-row";
export { Dialog, type DialogProps } from "./components/dialog";
export { EmptyState, type EmptyStateProps } from "./components/empty-state";
export {
  Checkbox,
  Field,
  FieldError,
  Input,
  Select,
  Textarea,
  controlClasses,
  errorId,
  helpId,
  type CheckboxProps,
  type ControlProps,
  type FieldProps,
  type InputProps,
  type SelectProps,
  type TextareaProps,
} from "./components/field";
export {
  Breadcrumbs,
  Container,
  PageHeader,
  Section,
  SkipLink,
  type BreadcrumbItem,
  type ContainerSize,
  type SectionTone,
} from "./components/layout";
export { AbsoluteDate, Money, type AbsoluteDateProps, type MoneyProps } from "./components/money";
export { Pagination, pageWindow, type PaginationProps } from "./components/pagination";
export { RadioCardGroup, type RadioCardGroupProps, type RadioCardOption } from "./components/radio-card-group";
export { Stepper, type StepperProps } from "./components/stepper";
export { Table, type TableColumn, type TableProps } from "./components/table";
export { Tabs, type TabItem, type TabsProps } from "./components/tabs";
export { Wordmark, type WordmarkProps } from "./components/wordmark";

// Premium layer: media hero, editorial headers, bento grids, flip and expandable cards, detail
// dialogs, stat tiles, trust strips, step timelines, ledger strips, scroll reveals and the sticky
// mobile CTA. Motion rules live in theme.css and honor prefers-reduced-motion.
export { RouteMapArt, BoxesArt } from "./art";
export { Bento, BentoCell, type BentoCellProps, type BentoSpan } from "./components/bento";
export { DetailDialog, type DetailDialogProps } from "./components/detail-dialog";
export { ExpandableCard, type ExpandableCardProps } from "./components/expandable-card";
export { FlipCard, type FlipCardProps } from "./components/flip-card";
export { MediaHero, PageHero, type MediaHeroProps } from "./components/hero";
export { LedgerStrip, type LedgerRow, type LedgerStripProps } from "./components/ledger-strip";
export { JsFlag, Reveal, type RevealProps } from "./components/reveal";
export { SectionHeader, type SectionHeaderProps } from "./components/section-header";
export { StatRow, StatTile, type StatTileProps } from "./components/stat-tile";
export { StickyCta, type StickyCtaProps } from "./components/sticky-cta";
export { Timeline, type TimelineProps, type TimelineStep } from "./components/timeline";
export { QuoteCard, TrustStrip, type TrustItem } from "./components/trust-strip";
