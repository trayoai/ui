/**
 * Trayo GTM UI — Trayo's UI kit for go-to-market applications.
 *
 * This directory is vendored into your project. Import the stylesheet once
 * from your CSS entry (`@import "./trayo-ui/styles/trayo-ui.css";`), then
 * import components from here:
 *
 *   import { Person, CompanyCard, Button } from './trayo-ui'
 *
 * README.md (beside this file) is the full surface; AGENTS.md is the short
 * directive version of the house rules.
 */

/* ---------------------------------------------------------------- entities */
export { Person, PersonCard, PersonContactLinks, personPhotoUrl } from './components/person'
export type { PersonLike, PersonProps, PersonCardProps } from './components/person'
export { Company, CompanyCard, CompanyMeta } from './components/company'
export type { CompanyLike, CompanyProps, CompanyCardProps } from './components/company'
export { PersonAvatar, AVATAR_SIZES } from './components/person-avatar'
export type { PersonAvatarProps, AvatarSize } from './components/person-avatar'
export { CompanyLogo, LOGO_SIZES } from './components/company-logo'
export type { CompanyLogoProps, LogoSize } from './components/company-logo'
export { ToneAvatar } from './components/tone-avatar'
export type { AvatarTone } from './components/tone-avatar'

/* ------------------------------------------------------------------ tables */
export { DataTable } from './components/data-table'
export type {
  Column,
  SortState,
  DataTableProps,
  DataTableSelection,
  DataTablePagination,
} from './components/data-table'
export { DataTableSkeletonRow } from './components/skeleton-row'
export { Pagination } from './components/ui/pagination'
export type { PaginationProps } from './components/ui/pagination'
export { usePagination } from './components/ui/use-pagination'
export {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from './components/ui/table'

/* -------------------------------------------------- layout, surfaces, type */
export {
  AppShell,
  AppShellNavLink,
  BrandMesh,
  EmptyState,
  GradientText,
  PageContainer,
  PageHeader,
  StatGrid,
  StatTile,
  Surface,
  Well,
} from './components/surfaces'
export { Callout } from './components/callout'
export type { CalloutProps, CalloutTone } from './components/callout'
export {
  Body,
  CardTitle,
  Code,
  DataLabel,
  Display,
  EntityName,
  Eyebrow,
  Hero,
  Label as TypeLabel,
  Meta,
  PageTitle,
  SectionLabel,
  SectionTitle,
} from './components/typography'

/* ------------------------------------------------------------------ charts */
export { ChartLegend } from './components/chart-legend'
export type { ChartLegendItem, ChartLegendProps } from './components/chart-legend'
export {
  CHART_COLORS,
  CHART_MUTED,
  CHART_SEQUENTIAL,
  chartColor,
  chartSequential,
} from './lib/chart'

/* -------------------------------------------------------------- primitives */
export {
  BUTTON_VARIANTS,
  BUTTON_VARIANT_ALIASES,
  Button,
  buttonVariants,
} from './components/ui/button'
export type { ButtonProps, ButtonVariant, ButtonVariantAlias } from './components/ui/button'
export { Badge, badgeVariants } from './components/ui/badge'
export { TagChip } from './components/ui/tag-chip'
export {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle as CardTitlePrimitive,
} from './components/ui/card'
export { Avatar, AvatarFallback, AvatarImage } from './components/ui/avatar'
export { Input } from './components/ui/input'
export { Textarea } from './components/ui/textarea'
export { Label } from './components/ui/label'
export { Checkbox } from './components/ui/checkbox'
export { Switch } from './components/ui/switch'
export { Progress } from './components/ui/progress'
export { Separator } from './components/ui/separator'
export { Skeleton } from './components/ui/skeleton'
export { ScrollArea, ScrollBar } from './components/ui/scroll-area'
export { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs'
export { SegmentedControl } from './components/ui/segmented-control'
export type { SegmentedControlOption, SegmentedControlProps } from './components/ui/segmented-control'
export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './components/ui/tooltip'
export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from './components/ui/select'
export {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './components/ui/dropdown-menu'
export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './components/ui/dialog'
export { Popover, PopoverAnchor, PopoverContent, PopoverTrigger } from './components/ui/popover'
export { Toaster, toast, useToast } from './components/ui/toast'
export type { ToastOptions, ToastVariant } from './components/ui/toast'

/* ------------------------------------------------------------------ config */
export { TrayoUIProvider, useTrayoUI } from './lib/config'
export type { TrayoUIConfig } from './lib/config'

/* ----------------------------------------------------------- brand theme */
// A customer's colours on the kit: pick the slots (or map a brand theme
// contract), resolve them, and put the CSS + attributes on <html>.
export {
  BRAND_ATTRIBUTE,
  BRAND_SHELL_ATTRIBUTE,
  BRAND_SLOTS,
  BRAND_SURFACES_ATTRIBUTE,
  SHELL_REGION_ATTRIBUTE,
  brandAttributes,
  brandPaletteCss,
  brandPaletteStyle,
  brandSlotsAgentGuide,
  checkBrandPalette,
  fromBrandThemeContract,
  resolveBrandPalette,
} from './lib/brand-palette'
export type {
  BrandPaletteInput,
  BrandPaletteProblem,
  BrandSlotName,
  BrandThemeContract,
  ContractMapping,
  ContractOptions,
  ResolvedBrandPalette,
} from './lib/brand-palette'

/* ----------------------------------------------------------------- helpers */
export { cn } from './lib/cn'
export { initials } from './lib/initials'
export { brandImageUrl, logoCandidates, normalizeDomain } from './lib/brand-image'
export {
  DEFAULT_PLACEHOLDER_FACE_BASE,
  PLACEHOLDER_FACE_COUNT,
  placeholderFaceFilename,
  placeholderFaceIndex,
  placeholderFaceUrl,
} from './lib/placeholder-faces'
export type { IsGenericPhoto } from './lib/profile-image'
