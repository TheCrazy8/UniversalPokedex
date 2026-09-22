import { h } from 'vue';
import VPLTheme from '@lando/vitepress-theme-default-plus';
import 'viewerjs/dist/viewer.min.css';
import imageViewer from 'vitepress-plugin-image-viewer';
import vImageViewer from 'vitepress-plugin-image-viewer/lib/vImageViewer.vue';
import { useData, useRoute } from 'vitepress';
import vitepressBackToTop from 'vitepress-plugin-back-to-top';
import 'vitepress-plugin-back-to-top/dist/style.css';
import '@nolebase/vitepress-plugin-enhanced-readabilities/client/style.css';
import { 
  NolebaseEnhancedReadabilitiesMenu,
  NolebaseEnhancedReadabilitiesScreenMenu,
} from '@nolebase/vitepress-plugin-enhanced-readabilities/client';
import { NolebaseEnhancedReadabilitiesPlugin } from '@nolebase/vitepress-plugin-enhanced-readabilities/client';
import { NolebaseGitChangelogPlugin } from '@nolebase/vitepress-plugin-git-changelog/client';
import '@nolebase/vitepress-plugin-git-changelog/client/style.css';
import { NolebaseHighlightTargetedHeading } from '@nolebase/vitepress-plugin-highlight-targeted-heading/client';
import '@nolebase/vitepress-plugin-highlight-targeted-heading/client/style.css';
import { NolebaseInlineLinkPreviewPlugin } from '@nolebase/vitepress-plugin-inline-link-preview/client';
import '@nolebase/vitepress-plugin-inline-link-preview/client/style.css';
import { enhanceAppWithTabs } from 'vitepress-plugin-tabs/client';
import 'virtual:group-icons.css';
import vitepressNprogress from 'vitepress-plugin-nprogress';
import 'vitepress-plugin-nprogress/lib/css/index.css';
import codeblocksFold from 'vitepress-plugin-codeblocks-fold';
import 'vitepress-plugin-codeblocks-fold/style/index.css';
import 'vitepress-markdown-timeline/dist/theme/index.css';
import giscusTalk from 'vitepress-plugin-comment-with-giscus';
import { toRefs } from 'vue';

// Custom layout that properly forwards all slots
import CustomLayout from './components/CustomLayout.vue';

// Import all custom components
import PWAPrompt from './components/PWAPrompt.vue';
import PWAInstallPrompt from './components/PWAInstallPrompt.vue';
import FireParticles from './components/FireParticles.vue';
import CursorTrail from './components/CursorTrail.vue';
import AnnouncementBanner from './components/AnnouncementBanner.vue';
import ProgressBar from './components/ProgressBar.vue';
import Breadcrumbs from './components/Breadcrumbs.vue';
import FeedbackWidget from './components/FeedbackWidget.vue';
import ShareButtons from './components/ShareButtons.vue';
import ToastNotification from './components/ToastNotification.vue';
import CopyCodeButton from './components/CopyCodeButton.vue';
import PluginCard from './components/PluginCard.vue';
import LoadingSpinner from './components/LoadingSpinner.vue';
import DownloadStats from './components/DownloadStats.vue';
import GitHubAuthButton from './components/GitHubAuthButton.vue';
import ReadingTime from './components/ReadingTime.vue';
import KeyboardShortcuts from './components/KeyboardShortcuts.vue';
import ScrollProgress from './components/ScrollProgress.vue';
import ContributorsList from './components/ContributorsList.vue';
import StatusBadges from './components/StatusBadges.vue';


import './styles/main.css';

export default {
  extends: VPLTheme,

  Layout: () => {
    return h(CustomLayout, null, {
      // Top of page
      'layout-top': () => [
        h(NolebaseHighlightTargetedHeading),
        h(AnnouncementBanner),
        h(ProgressBar),
        h(ToastNotification)
      ],
      
      // Navbar additions
      'nav-bar-content-after': () => [
        h(NolebaseEnhancedReadabilitiesMenu)
      ],
      
      // Mobile menu
      'nav-screen-content-after': () => h(NolebaseEnhancedReadabilitiesScreenMenu),
      
      // Before document content
      'doc-before': () => [
        h(Breadcrumbs),
        h(ReadingTime),
        h(StatusBadges)
      ],
      
      // After document content
      'doc-after': () => [
        h(ShareButtons),
        h(FeedbackWidget),
        h(ContributorsList)
      ],
      
      // Bottom of page
      'layout-bottom': () => [
        h(FireParticles),
        h(CursorTrail),
        h(PWAPrompt),
        h(PWAInstallPrompt),
        h(KeyboardShortcuts),
        h(ScrollProgress)
      ]
    });
  },

  enhanceApp(ctx) {
    ctx.app.use(NolebaseEnhancedReadabilitiesPlugin);
    ctx.app.use(NolebaseGitChangelogPlugin);
    ctx.app.use(NolebaseInlineLinkPreviewPlugin);
    enhanceAppWithTabs(ctx.app);
    vitepressNprogress(ctx);
    
    if (VPLTheme.enhanceApp) {
      VPLTheme.enhanceApp(ctx);
    }
    
    // Register global components for use in markdown
    ctx.app.component('vImageViewer', vImageViewer);
    ctx.app.component('CopyCodeButton', CopyCodeButton);
    ctx.app.component('PluginCard', PluginCard);
    ctx.app.component('LoadingSpinner', LoadingSpinner);
    ctx.app.component('DownloadStats', DownloadStats);
    ctx.app.component('GitHubAuthButton', GitHubAuthButton);
    
    vitepressBackToTop({ threshold: 300 });
  },

  setup() {
    const route = useRoute();
    const { frontmatter } = useData();
    imageViewer(route);
    codeblocksFold({ route, frontmatter });
    giscusTalk({
      repo: 'TheCrazy8/SplatoonDimensions',
      repoId: 'R_kgDOTuCp2g',           // Get from https://giscus.app/
      category: 'General',
      categoryId: 'DIC_kwDOTuCp2s4DCrY6',    // Get from https://giscus.app/
      mapping: 'pathname',
      inputPosition: 'top',
      lang: 'en',
      homePageShowComment: false,
      lightTheme: 'light',
      darkTheme: 'transparent_dark',
    }, { frontmatter: toRefs(useData()).frontmatter, route }, true);
  },
};
