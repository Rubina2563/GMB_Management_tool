import { ForwardRefExoticComponent, RefAttributes, SVGProps } from 'react';
import { 
  HomeIcon, 
  UsersIcon, 
  KeyIcon, 
  CreditCardIcon,
  DocumentTextIcon,
  ChatBubbleLeftIcon,
  DocumentDuplicateIcon,
  MagnifyingGlassIcon,
  ArrowLeftOnRectangleIcon,
  ChartBarIcon,
  RocketLaunchIcon,
  TrophyIcon,
  BuildingStorefrontIcon,
  Cog6ToothIcon,
  UserCircleIcon,
  CalendarIcon,
  FolderIcon,
  PhotoIcon,
  GlobeAltIcon,
} from '@heroicons/react/24/outline';

// Define type for menu items
export type IconType = ForwardRefExoticComponent<Omit<SVGProps<SVGSVGElement>, "ref"> & { 
  title?: string | undefined; 
  titleId?: string | undefined; 
} & RefAttributes<SVGSVGElement>>;

export interface MenuItem {
  path: string;
  label: string;
  icon: IconType;
  special?: string;
}

// Define menu items for admin
export const adminMenuItems: MenuItem[] = [
  { path: '/admin/dashboard', label: 'DASHBOARD', icon: HomeIcon },
  { path: '/admin/users', label: 'USERS', icon: UsersIcon },
  { path: '/admin/subscriptions', label: 'SUBSCRIPTIONS', icon: CreditCardIcon },
  { path: '/admin/api-keys', label: 'API KEYS', icon: KeyIcon },
];

// Define standalone menu items (not in groups)
export const standaloneMenuItems: MenuItem[] = [
  { path: '/client/dashboard', label: 'LOCAL DASHBOARD', icon: HomeIcon },
  { path: '/client/locations', label: 'LOCATIONS', icon: BuildingStorefrontIcon },
  { path: '/client/gbp-audit', label: 'GBP AUDIT', icon: MagnifyingGlassIcon },
  { path: '/client/optimization', label: 'OPTIMIZATION (GBP INSIGHTS)', icon: RocketLaunchIcon },
];

// Define groups for client sidebar navigation
export interface MenuGroup {
  id: string;
  label: string;
  icon: IconType;
  items: MenuItem[];
}

// Define client menu groups according to the prompt specifications
export const clientMenuGroups: MenuGroup[] = [
  {
    id: 'gbp-management',
    label: 'GBP MANAGEMENT',
    icon: GlobeAltIcon,
    items: [
      { path: '/client/gbp-management/image-optimization', label: 'IMAGE OPTIMIZATION', icon: PhotoIcon },
      { path: '/client/gbp-management/faqs-reply', label: 'FAQS REPLY', icon: ChatBubbleLeftIcon },
      { path: '/client/gbp-management/description-generator', label: 'DESCRIPTION GENERATOR', icon: DocumentTextIcon },
    ]
  },
  {
    id: 'reputation-management',
    label: 'REPUTATION MANAGEMENT',
    icon: ChatBubbleLeftIcon, // (formerly Reviews)
    items: [
      { path: '/client/review-management', label: 'REVIEW MANAGEMENT', icon: ChatBubbleLeftIcon },
      { path: '/client/request-reviews', label: 'REQUEST REVIEWS', icon: DocumentTextIcon },
      { path: '/client/sentiment-analysis', label: 'SENTIMENT ANALYSIS', icon: ChartBarIcon },
    ]
  },
  {
    id: 'content-management',
    label: 'CONTENT MANAGEMENT',
    icon: DocumentTextIcon, // (formerly Posts)
    items: [
      { path: '/client/posts', label: 'CREATE GBP POST', icon: CalendarIcon, special: 'create-post' },
      { path: '/client/posts/scheduler', label: 'POST SCHEDULER', icon: CalendarIcon, special: 'post-scheduler' },
      { path: '/client/posts/analytics', label: 'POST ANALYTICS', icon: ChartBarIcon, special: 'post-analytics' },
    ]
  },
  {
    id: 'local-ranking',
    label: 'LOCAL RANKING',
    icon: TrophyIcon, // (formerly Campaigns)
    items: [
      { path: '/client/rankings', label: 'GBP MAP RANKINGS', icon: MagnifyingGlassIcon },
      { path: '/client/local-rankings/organic', label: 'LOCAL ORGANIC RANKINGS', icon: ChartBarIcon },
      { path: '/client/campaigns', label: 'CAMPAIGNS', icon: FolderIcon },
    ]
  },
  {
    id: 'local-links',
    label: 'LOCAL LINKS',
    icon: BuildingStorefrontIcon, // (formerly Citations)
    items: [
      { path: '/client/local-links/citation-report', label: 'CITATION REPORT', icon: DocumentTextIcon },
      { path: '/client/local-links/competitor-gap', label: 'COMPETITOR GAP ANALYSIS', icon: ChartBarIcon },
      { path: '/client/local-links/build-citations', label: 'BUILD CITATIONS', icon: BuildingStorefrontIcon },
    ]
  },
  {
    id: 'admin',
    label: 'ADMIN',
    icon: Cog6ToothIcon,
    items: [
      { path: '/client/account', label: 'ACCOUNT', icon: UserCircleIcon },
      { path: '/client/subscription', label: 'SUBSCRIPTION', icon: CreditCardIcon },
    ]
  }
];