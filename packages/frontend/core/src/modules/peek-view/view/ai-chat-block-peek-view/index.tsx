import { toReactNode } from '@affine/component';
import { AIChatBlockPeekViewTemplate } from '@affine/core/blocksuite/ai';
import type { AIChatBlockModel } from '@affine/core/blocksuite/ai/blocks/ai-chat-block/model/ai-chat-model';
import { useAIChatConfig } from '@affine/core/components/hooks/affine/use-ai-chat-config';
import { SpecProvider } from '@blocksuite/affine/shared/utils';
import type { EditorHost } from '@blocksuite/affine/std';
import { useMemo } from 'react';

export type AIChatBlockPeekViewProps = {
  model: AIChatBlockModel;
  host: EditorHost;
};

export const AIChatBlockPeekView = ({
  model,
  host,
}: AIChatBlockPeekViewProps) => {
  const { docDisplayConfig, searchMenuConfig, networkSearchConfig } =
    useAIChatConfig();
  return useMemo(() => {
    const previewSpecBuilder = SpecProvider._.getSpec('preview:page');
    const template = AIChatBlockPeekViewTemplate(
      model,
      host,
      previewSpecBuilder,
      docDisplayConfig,
      searchMenuConfig,
      networkSearchConfig
    );
    return toReactNode(template);
  }, [model, host, docDisplayConfig, searchMenuConfig, networkSearchConfig]);
};
