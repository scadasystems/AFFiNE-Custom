import { Loading, Scrollable } from '@affine/component';
import { WorkspaceDetailSkeleton } from '@affine/component/setting-components';
import type { ModalProps } from '@affine/component/ui/modal';
import { Modal } from '@affine/component/ui/modal';
import {
  AuthService,
  DefaultServerService,
  ServersService,
} from '@affine/core/modules/cloud';
import type { DialogComponentProps } from '@affine/core/modules/dialogs';
import type {
  SettingTab,
  WORKSPACE_DIALOG_SCHEMA,
} from '@affine/core/modules/dialogs/constant';
import { GlobalContextService } from '@affine/core/modules/global-context';
import { ServerDeploymentType } from '@affine/graphql';
import { ContactWithUsIcon } from '@blocksuite/icons/rc';
import { FrameworkScope, useLiveData, useService } from '@toeverything/infra';
import { debounce } from 'lodash-es';
import {
  Suspense,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { flushSync } from 'react-dom';

import { AccountSetting } from './account-setting';
import { GeneralSetting } from './general-setting';
import { IssueFeedbackModal } from './issue-feedback-modal';
import { SettingSidebar } from './setting-sidebar';
import { StarAFFiNEModal } from './star-affine-modal';
import * as style from './style.css';
import type { SettingState } from './types';
import { WorkspaceSetting } from './workspace-setting';

interface SettingProps extends ModalProps {
  activeTab?: SettingTab;
  onCloseSetting: () => void;
  scrollAnchor?: string;
}

const isWorkspaceSetting = (key: string): boolean =>
  key.startsWith('workspace:');

const CenteredLoading = () => {
  return (
    <div className={style.centeredLoading}>
      <Loading size={24} />
    </div>
  );
};

const SettingModalInner = ({
  activeTab: initialActiveTab = 'appearance',
  onCloseSetting,
  scrollAnchor: initialScrollAnchor,
}: SettingProps) => {
  const [settingState, setSettingState] = useState<SettingState>({
    activeTab: initialActiveTab,
    scrollAnchor: initialScrollAnchor,
  });
  const globalContextService = useService(GlobalContextService);

  const currentServerId = useLiveData(
    globalContextService.globalContext.serverId.$
  );
  const serversService = useService(ServersService);
  const defaultServerService = useService(DefaultServerService);
  const currentServer =
    useLiveData(
      currentServerId ? serversService.server$(currentServerId) : null
    ) ?? defaultServerService.server;
  const loginStatus = useLiveData(
    currentServer.scope.get(AuthService).session.status$
  );
  const isSelfhosted = useLiveData(
    currentServer.config$.selector(
      c => c.type === ServerDeploymentType.Selfhosted
    )
  );

  const modalContentRef = useRef<HTMLDivElement>(null);
  const modalContentWrapperRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    let animationFrameId: number;
    const onResize = debounce(() => {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = requestAnimationFrame(() => {
        if (!modalContentRef.current || !modalContentWrapperRef.current) return;

        const wrapperWidth = modalContentWrapperRef.current.offsetWidth;
        const wrapperHeight = modalContentWrapperRef.current.offsetHeight;
        const contentWidth = modalContentRef.current.offsetWidth;

        const wrapper = modalContentWrapperRef.current;

        wrapper?.style.setProperty(
          '--setting-modal-width',
          `${wrapperWidth}px`
        );
        wrapper?.style.setProperty(
          '--setting-modal-height',
          `${wrapperHeight}px`
        );
        wrapper?.style.setProperty(
          '--setting-modal-content-width',
          `${contentWidth}px`
        );
        wrapper?.style.setProperty(
          '--setting-modal-gap-x',
          `${(wrapperWidth - contentWidth) / 2}px`
        );
      });
    }, 200);
    window.addEventListener('resize', onResize);
    onResize();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  const onTabChange = useCallback(
    (key: SettingTab) => {
      setSettingState({ activeTab: key });
    },
    [setSettingState]
  );
  const [openIssueFeedbackModal, setOpenIssueFeedbackModal] = useState(false);
  const [openStarAFFiNEModal, setOpenStarAFFiNEModal] = useState(false);

  // const handleOpenIssueFeedbackModal = useCallback(() => {
  //   setOpenIssueFeedbackModal(true);
  // }, [setOpenIssueFeedbackModal]);

  // const handleOpenStarAFFiNEModal = useCallback(() => {
  //   setOpenStarAFFiNEModal(true);
  // }, [setOpenStarAFFiNEModal]);

  useEffect(() => {
    if (
      isSelfhosted &&
      (settingState.activeTab === 'plans' ||
        settingState.activeTab === 'workspace:billing')
    ) {
      setSettingState({ activeTab: 'workspace:license' });
    }
  }, [isSelfhosted, settingState.activeTab]);

  useEffect(() => {
    if (settingState.scrollAnchor) {
      flushSync(() => {
        const target = modalContentRef.current?.querySelector(
          `#${settingState.scrollAnchor}`
        );
        if (target) {
          target.scrollIntoView();
        }
      });
    }
  }, [settingState]);
  return (
    <FrameworkScope scope={currentServer.scope}>
      <SettingSidebar
        activeTab={settingState.activeTab}
        onTabChange={onTabChange}
      />
      <Scrollable.Root>
        <Scrollable.Viewport
          data-testid="setting-modal-content"
          className={style.wrapper}
          ref={modalContentWrapperRef}
        >
          <div className={style.centerContainer}>
            <div ref={modalContentRef} className={style.content}>
              <Suspense fallback={<WorkspaceDetailSkeleton />}>
                {settingState.activeTab === 'account' &&
                loginStatus === 'authenticated' ? (
                  <AccountSetting onChangeSettingState={setSettingState} />
                ) : isWorkspaceSetting(settingState.activeTab) ? (
                  <WorkspaceSetting
                    activeTab={settingState.activeTab}
                    onCloseSetting={onCloseSetting}
                    onChangeSettingState={setSettingState}
                  />
                ) : !isWorkspaceSetting(settingState.activeTab) ? (
                  <GeneralSetting
                    activeTab={settingState.activeTab}
                    onChangeSettingState={setSettingState}
                  />
                ) : null}
              </Suspense>
            </div>
            <div className={style.footer}>
              <ContactWithUsIcon fontSize={16} />
              Created by LulzM (DICAMO)
              <span
                className={style.link}
                onClick={() =>
                  window.open('https://github.com/scadasystems', '_blank')
                }
                style={{
                  marginLeft: '8px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
              </span>
              {/* <Trans
                i18nKey={'com.affine.settings.suggestion-2'}
                components={{
                  1: (
                    <span
                      className={style.link}
                      onClick={handleOpenStarAFFiNEModal}
                    />
                  ),
                  2: (
                    <span
                      className={style.link}
                      onClick={handleOpenIssueFeedbackModal}
                    />
                  ), 
                }}
              /> */}
            </div>
            <StarAFFiNEModal
              open={openStarAFFiNEModal}
              setOpen={setOpenStarAFFiNEModal}
            />
            <IssueFeedbackModal
              open={openIssueFeedbackModal}
              setOpen={setOpenIssueFeedbackModal}
            />
          </div>
          <Scrollable.Scrollbar />
        </Scrollable.Viewport>
      </Scrollable.Root>
    </FrameworkScope>
  );
};

export const SettingDialog = ({
  close,
  activeTab,
  scrollAnchor,
}: DialogComponentProps<WORKSPACE_DIALOG_SCHEMA['setting']>) => {
  return (
    <Modal
      width={1280}
      height={920}
      contentOptions={{
        ['data-testid' as string]: 'setting-modal',
        style: {
          maxHeight: '85vh',
          maxWidth: '70vw',
          padding: 0,
          overflow: 'hidden',
          display: 'flex',
        },
      }}
      open
      onOpenChange={() => close()}
    >
      <Suspense fallback={<CenteredLoading />}>
        <SettingModalInner
          activeTab={activeTab}
          onCloseSetting={close}
          scrollAnchor={scrollAnchor}
        />
      </Suspense>
    </Modal>
  );
};
