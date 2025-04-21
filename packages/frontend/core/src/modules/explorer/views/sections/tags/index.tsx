import { IconButton } from '@affine/component';
import { ExplorerTreeRoot } from '@affine/core/modules/explorer/views/tree';
import { TagService } from '@affine/core/modules/tag';
import { useI18n } from '@affine/i18n';
import { track } from '@affine/track';
import { AddTagIcon } from '@blocksuite/icons/rc';
import { useLiveData, useServices } from '@toeverything/infra';
import { useCallback, useEffect, useState } from 'react';

import { ExplorerService } from '../../../services/explorer';
import { CollapsibleSection } from '../../layouts/collapsible-section';
import { ExplorerTagNode } from '../../nodes/tag';
import { ExplorerTreeNodeRenameModal as CreateTagModal } from '../../tree/node';
import { RootEmpty } from './empty';
import * as styles from './styles.css';

export const ExplorerTags = () => {
  const { tagService, explorerService } = useServices({
    TagService,
    ExplorerService,
  });
  const explorerSection = explorerService.sections.tags;
  const collapsed = useLiveData(explorerSection.collapsed$);
  const [creating, setCreating] = useState(false);
  const tags = useLiveData(tagService.tagList.tags$);

  const t = useI18n();

  const handleCreateNewTag = useCallback(
    (name: string) => {
      tagService.tagList.createTag(name, tagService.randomTagColor());
      track.$.navigationPanel.organize.createOrganizeItem({ type: 'tag' });
      explorerSection.setCollapsed(false);
    },
    [explorerSection, tagService]
  );

  useEffect(() => {
    if (collapsed) setCreating(false);
  }, [collapsed]);

  const handleOpenCreateModal = useCallback(() => {
    setCreating(true);
  }, []);

  return (
    <CollapsibleSection
      name="tags"
      testId="explorer-tags"
      headerClassName={styles.draggedOverHighlight}
      title={t['com.affine.rootAppSidebar.tags']()}
      actions={
        <div className={styles.iconContainer}>
          <IconButton
            data-testid="explorer-bar-add-tag-button"
            onClick={handleOpenCreateModal}
            size="16"
            tooltip={t[
              'com.affine.rootAppSidebar.explorer.tag-section-add-tooltip'
            ]()}
          >
            <AddTagIcon />
          </IconButton>
          {creating && (
            <CreateTagModal
              setRenaming={setCreating}
              handleRename={handleCreateNewTag}
              rawName={t['com.affine.rootAppSidebar.tags.new-tag']()}
              className={styles.createModalAnchor}
            />
          )}
        </div>
      }
    >
      <ExplorerTreeRoot placeholder={<RootEmpty />}>
        {tags.map(tag => (
          <ExplorerTagNode
            key={tag.id}
            tagId={tag.id}
            reorderable={false}
            location={{
              at: 'explorer:tags:list',
            }}
          />
        ))}
      </ExplorerTreeRoot>
    </CollapsibleSection>
  );
};
